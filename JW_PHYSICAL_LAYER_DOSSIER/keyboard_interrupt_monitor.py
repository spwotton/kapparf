#!/usr/bin/env python3
"""
KEYBOARD INTERRUPT FORENSICS MONITOR
=====================================
Detects and logs the source of spurious Ctrl+C signals.

Author: ECHO/ToroidalRecursion
Date: 2026-01-24

Key vectors for spurious keyboard interrupts:
1. Intel AMT/ME remote KVM injection
2. BadUSB/HID injection via USB
3. Bluetooth HID spoofing
4. Network-triggered signals (SMB/RPC)
5. RF-induced keyboard interference
6. MQTT/IoT control signals
"""

import os
import sys
import signal
import time
import datetime
import json
import threading
import ctypes
from pathlib import Path

# Windows-specific imports
if sys.platform == 'win32':
    import ctypes.wintypes
    
    # Low-level keyboard hook
    WH_KEYBOARD_LL = 13
    WM_KEYDOWN = 0x0100
    WM_KEYUP = 0x0101
    WM_SYSKEYDOWN = 0x0104
    VK_CONTROL = 0x11
    VK_C = 0x43
    
    HOOKPROC = ctypes.WINFUNCTYPE(
        ctypes.c_int, ctypes.c_int, 
        ctypes.wintypes.WPARAM, ctypes.wintypes.LPARAM
    )

class KeyboardInterruptForensics:
    def __init__(self):
        self.log_file = Path("signal_forensics/keyboard_interrupt_log.json")
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        
        self.events = []
        self.ctrl_pressed = False
        self.hook_handle = None
        self.monitoring = True
        
        # Track signal sources
        self.signal_counts = {
            'keyboard_hook': 0,
            'signal_handler': 0,
            'network_correlated': 0,
            'timing_anomaly': 0
        }
        
        # Network baseline
        self.last_network_check = time.time()
        self.network_connections = set()
        
    def log_event(self, event_type, details):
        """Log a keyboard interrupt event with full context."""
        event = {
            'timestamp': datetime.datetime.now().isoformat(),
            'epoch_ms': int(time.time() * 1000),
            'type': event_type,
            'details': details,
            'context': self.get_system_context()
        }
        
        self.events.append(event)
        
        # Save immediately
        with open(self.log_file, 'w') as f:
            json.dump({
                'events': self.events,
                'signal_counts': self.signal_counts,
                'analysis': self.analyze_patterns()
            }, f, indent=2)
        
        print(f"\n🚨 [{event['timestamp']}] {event_type}")
        print(f"   Details: {details}")
        
    def get_system_context(self):
        """Capture system state at moment of interrupt."""
        context = {
            'active_window': 'unknown'
        }
        
        if sys.platform == 'win32':
            try:
                # Get foreground window
                user32 = ctypes.windll.user32
                hwnd = user32.GetForegroundWindow()
                length = user32.GetWindowTextLengthW(hwnd)
                buffer = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buffer, length + 1)
                context['active_window'] = buffer.value
                
                # Get keyboard state
                keyboard_state = (ctypes.c_byte * 256)()
                user32.GetKeyboardState(keyboard_state)
                context['ctrl_state'] = keyboard_state[VK_CONTROL]
                context['shift_state'] = keyboard_state[0x10]
                context['alt_state'] = keyboard_state[0x12]
                
            except Exception as e:
                context['error'] = str(e)
                
        return context
        
    def check_network_trigger(self):
        """Check if keyboard interrupt correlates with network activity."""
        try:
            import subprocess
            result = subprocess.run(
                ['netstat', '-ano'],
                capture_output=True,
                text=True,
                timeout=2
            )
            
            current_connections = set()
            for line in result.stdout.split('\n'):
                if 'ESTABLISHED' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        current_connections.add((parts[2], parts[4]))
            
            # Check for new connections since last check
            new_connections = current_connections - self.network_connections
            self.network_connections = current_connections
            
            if new_connections:
                return list(new_connections)
                
        except Exception:
            pass
            
        return []
        
    def signal_handler(self, signum, frame):
        """Catch SIGINT at the Python level."""
        self.signal_counts['signal_handler'] += 1
        
        # Check for network correlation
        new_conns = self.check_network_trigger()
        if new_conns:
            self.signal_counts['network_correlated'] += 1
            
        # Get stack trace
        import traceback
        stack = traceback.extract_stack(frame)
        
        self.log_event('SIGINT_CAUGHT', {
            'signal_number': signum,
            'frame_info': str(frame),
            'stack_trace': [str(s) for s in stack[-5:]],
            'new_network_connections': new_conns,
            'source': 'EXTERNAL - not from keyboard hook'
        })
        
        # Don't actually exit - we want to continue monitoring
        print("\n⚠️  SIGINT SUPPRESSED - continuing monitoring...")
        
    def keyboard_hook_callback(self, nCode, wParam, lParam):
        """Low-level keyboard hook to catch Ctrl+C at hardware level."""
        if nCode >= 0:
            # lParam points to KBDLLHOOKSTRUCT
            vk_code = ctypes.cast(lParam, ctypes.POINTER(ctypes.c_ulong))[0]
            
            if vk_code == VK_CONTROL:
                if wParam in (WM_KEYDOWN, WM_SYSKEYDOWN):
                    self.ctrl_pressed = True
                elif wParam == WM_KEYUP:
                    self.ctrl_pressed = False
                    
            elif vk_code == VK_C and self.ctrl_pressed:
                if wParam == WM_KEYDOWN:
                    self.signal_counts['keyboard_hook'] += 1
                    
                    # Check timing anomaly (too fast to be human)
                    if hasattr(self, 'last_ctrl_c') and \
                       (time.time() - self.last_ctrl_c) < 0.1:
                        self.signal_counts['timing_anomaly'] += 1
                        
                    self.last_ctrl_c = time.time()
                    
                    self.log_event('CTRL_C_KEYDOWN', {
                        'source': 'KEYBOARD_HOOK',
                        'vk_code': vk_code,
                        'flags': 'captured at hardware level'
                    })
        
        # Pass to next hook
        return ctypes.windll.user32.CallNextHookEx(
            self.hook_handle, nCode, wParam, lParam
        )
        
    def install_keyboard_hook(self):
        """Install low-level keyboard hook on Windows."""
        if sys.platform != 'win32':
            print("Keyboard hook only available on Windows")
            return False
            
        try:
            self.hook_proc = HOOKPROC(self.keyboard_hook_callback)
            
            self.hook_handle = ctypes.windll.user32.SetWindowsHookExW(
                WH_KEYBOARD_LL,
                self.hook_proc,
                ctypes.windll.kernel32.GetModuleHandleW(None),
                0
            )
            
            if self.hook_handle:
                print("✅ Low-level keyboard hook installed")
                return True
            else:
                print("❌ Failed to install keyboard hook")
                return False
                
        except Exception as e:
            print(f"❌ Hook installation error: {e}")
            return False
            
    def analyze_patterns(self):
        """Analyze patterns in interrupt events."""
        if len(self.events) < 2:
            return {'status': 'insufficient_data'}
            
        analysis = {
            'total_events': len(self.events),
            'signal_sources': self.signal_counts,
            'anomalies': []
        }
        
        # Check for timing patterns
        if self.signal_counts['timing_anomaly'] > 0:
            analysis['anomalies'].append({
                'type': 'RAPID_FIRE_CTRL_C',
                'description': 'Ctrl+C events too fast for human input',
                'count': self.signal_counts['timing_anomaly'],
                'implication': 'AUTOMATED/REMOTE INJECTION LIKELY'
            })
            
        # Check for network correlation
        if self.signal_counts['network_correlated'] > 0:
            analysis['anomalies'].append({
                'type': 'NETWORK_CORRELATED',
                'description': 'Keyboard interrupts coincide with network activity',
                'count': self.signal_counts['network_correlated'],
                'implication': 'REMOTE TRIGGER POSSIBLE'
            })
            
        # Check for discrepancy between hook and signal
        hook_count = self.signal_counts['keyboard_hook']
        signal_count = self.signal_counts['signal_handler']
        
        if signal_count > hook_count:
            analysis['anomalies'].append({
                'type': 'PHANTOM_SIGNALS',
                'description': f'{signal_count - hook_count} SIGINT without keyboard events',
                'count': signal_count - hook_count,
                'implication': 'SIGNALS INJECTED AT OS/DRIVER LEVEL'
            })
            
        return analysis
        
    def message_loop(self):
        """Windows message loop for keyboard hook."""
        msg = ctypes.wintypes.MSG()
        while self.monitoring:
            ret = ctypes.windll.user32.GetMessageW(
                ctypes.byref(msg), None, 0, 0
            )
            if ret <= 0:
                break
            ctypes.windll.user32.TranslateMessage(ctypes.byref(msg))
            ctypes.windll.user32.DispatchMessageW(ctypes.byref(msg))
            
    def run(self):
        """Main monitoring loop."""
        print("=" * 60)
        print("  KEYBOARD INTERRUPT FORENSICS MONITOR")
        print("=" * 60)
        print(f"\nStarted: {datetime.datetime.now()}")
        print("Monitoring for spurious Ctrl+C / SIGINT signals...")
        print("This will catch and log any keyboard interrupts.")
        print("\nPress Ctrl+Break to actually stop monitoring.\n")
        
        # Install signal handler
        signal.signal(signal.SIGINT, self.signal_handler)
        
        # Install keyboard hook
        if sys.platform == 'win32':
            self.install_keyboard_hook()
            
            # Run message loop in background thread
            msg_thread = threading.Thread(target=self.message_loop, daemon=True)
            msg_thread.start()
        
        # Main monitoring loop
        try:
            while self.monitoring:
                time.sleep(1)
                
                # Periodic status
                if len(self.events) > 0 and len(self.events) % 5 == 0:
                    analysis = self.analyze_patterns()
                    if analysis.get('anomalies'):
                        print(f"\n📊 Analysis: {len(analysis['anomalies'])} anomalies detected")
                        for a in analysis['anomalies']:
                            print(f"   ⚠️  {a['type']}: {a['implication']}")
                            
        except KeyboardInterrupt:
            pass  # Caught by signal handler
        finally:
            self.monitoring = False
            if self.hook_handle:
                ctypes.windll.user32.UnhookWindowsHookEx(self.hook_handle)
                
            print("\n\nFinal Analysis:")
            print(json.dumps(self.analyze_patterns(), indent=2))
            print(f"\nLog saved to: {self.log_file}")


if __name__ == '__main__':
    monitor = KeyboardInterruptForensics()
    monitor.run()
