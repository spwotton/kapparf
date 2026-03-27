#!/usr/bin/env python3
"""
CONGUSTO-EITEL Defense Suite Master Orchestrator
Coordinates Tube-SDR, Marconi Correlator, and Modbus Sentinel
Unified threat detection and reporting across RF, temporal, and network domains
"""

import sys
import json
import argparse
import logging
import time
import subprocess
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class DefenseSuiteConfig:
    """Master configuration for orchestration"""
    
    # RF Layer (Tube-SDR)
    tube_sdr_enabled: bool = True
    tube_sdr_frequency: float = 1000.0
    tube_sdr_sample_rate: int = 48000
    tube_sdr_gain: float = 1000.0
    tube_sdr_duration: float = 60.0
    
    # Temporal Layer (Marconi)
    marconi_enabled: bool = True
    marconi_sample_rate: int = 48000
    marconi_period: float = 21.333
    marconi_duration: float = 60.0
    marconi_num_stacks: int = 100
    
    # Network Layer (Modbus)
    modbus_enabled: bool = True
    modbus_port: int = 502
    modbus_scada_port: int = 80
    modbus_heartbeat_period: float = 21.333
    modbus_log_level: str = "INFO"
    
    # Browser Layer (PartyTown)
    browser_blocker_enabled: bool = True
    browser_method: str = "tampermonkey"  # tampermonkey or ublock
    
    # Orchestration
    correlation_enabled: bool = True
    output_dir: str = "./defense_results"
    log_level: str = "INFO"
    timeout_seconds: int = 120

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """Configure structured logger"""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level))
    
    formatter = logging.Formatter(
        '%(asctime)s [%(name)s] [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger

logger = setup_logger('CONGUSTO-Defense', 'INFO')

# ============================================================================
# TOOL EXECUTORS
# ============================================================================

class TubeSDRExecutor:
    """Execute Tube-SDR Demodulator"""
    
    def __init__(self, config: DefenseSuiteConfig):
        self.config = config
        self.logger = setup_logger('Tube-SDR')
        self.process = None
        self.results: List[Dict[str, Any]] = []
    
    def start(self) -> bool:
        """Launch Tube-SDR subprocess"""
        if not self.config.tube_sdr_enabled:
            self.logger.info("Skipped (disabled)")
            return True
        
        try:
            cmd = [
                sys.executable,
                "tube_sdr_demodulator.py",
                f"--frequency={self.config.tube_sdr_frequency}",
                f"--sample-rate={self.config.tube_sdr_sample_rate}",
                f"--gain={self.config.tube_sdr_gain}",
                f"--duration={self.config.tube_sdr_duration}",
                f"--output-json=tube_sdr_output.json"
            ]
            
            self.logger.info(f"Starting: {' '.join(cmd)}")
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to start: {e}")
            return False
    
    def wait(self, timeout: int = 120) -> bool:
        """Wait for completion"""
        if not self.process:
            return False
        
        try:
            self.process.wait(timeout=timeout)
            stdout, stderr = self.process.communicate()
            
            if self.process.returncode != 0:
                self.logger.error(f"Process failed: {stderr}")
                return False
            
            # Parse results
            if os.path.exists("tube_sdr_output.json"):
                with open("tube_sdr_output.json", "r") as f:
                    self.results = json.load(f)
                self.logger.info(f"Detected {len(self.results)} events")
            
            return True
        
        except subprocess.TimeoutExpired:
            self.logger.error("Timeout")
            self.process.kill()
            return False
    
    def get_results(self) -> List[Dict[str, Any]]:
        """Retrieve detection results"""
        return self.results


class MarconiExecutor:
    """Execute Marconi Spark Correlator"""
    
    def __init__(self, config: DefenseSuiteConfig):
        self.config = config
        self.logger = setup_logger('Marconi')
        self.process = None
        self.results: Dict[str, Any] = {}
    
    def start(self) -> bool:
        """Launch Marconi Correlator subprocess"""
        if not self.config.marconi_enabled:
            self.logger.info("Skipped (disabled)")
            return True
        
        try:
            cmd = [
                sys.executable,
                "marconi_spark_correlator.py",
                f"--sample-rate={self.config.marconi_sample_rate}",
                f"--period={self.config.marconi_period}",
                f"--duration={self.config.marconi_duration}",
                f"--num-stacks={self.config.marconi_num_stacks}",
                f"--output-json=marconi_output.json"
            ]
            
            self.logger.info(f"Starting: {' '.join(cmd)}")
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to start: {e}")
            return False
    
    def wait(self, timeout: int = 120) -> bool:
        """Wait for completion"""
        if not self.process:
            return False
        
        try:
            self.process.wait(timeout=timeout)
            stdout, stderr = self.process.communicate()
            
            if self.process.returncode != 0:
                self.logger.error(f"Process failed: {stderr}")
                return False
            
            # Parse results
            if os.path.exists("marconi_output.json"):
                with open("marconi_output.json", "r") as f:
                    self.results = json.load(f)
                self.logger.info(f"Coherence: {self.results.get('coherence_score', 'N/A')}")
            
            return True
        
        except subprocess.TimeoutExpired:
            self.logger.error("Timeout")
            self.process.kill()
            return False
    
    def get_results(self) -> Dict[str, Any]:
        """Retrieve detection results"""
        return self.results


class ModbusExecutor:
    """Execute Modbus Sentinel"""
    
    def __init__(self, config: DefenseSuiteConfig):
        self.config = config
        self.logger = setup_logger('Modbus')
        self.process = None
        self.results: List[Dict[str, Any]] = []
    
    def start(self) -> bool:
        """Launch Modbus Sentinel subprocess"""
        if not self.config.modbus_enabled:
            self.logger.info("Skipped (disabled)")
            return True
        
        try:
            cmd = [
                sys.executable,
                "modbus_sentinel.py",
                f"--port={self.config.modbus_port}",
                f"--scada-port={self.config.modbus_scada_port}",
                f"--heartbeat-period={self.config.modbus_heartbeat_period}",
                f"--log-level={self.config.modbus_log_level}",
                f"--output-json=modbus_output.json"
            ]
            
            self.logger.info(f"Starting: {' '.join(cmd)}")
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to start: {e}")
            return False
    
    def wait(self, timeout: int = 120) -> bool:
        """Wait for completion"""
        if not self.process:
            return False
        
        try:
            self.process.wait(timeout=timeout)
            stdout, stderr = self.process.communicate()
            
            if self.process.returncode != 0:
                self.logger.error(f"Process failed: {stderr}")
                return False
            
            # Parse results
            if os.path.exists("modbus_output.json"):
                with open("modbus_output.json", "r") as f:
                    data = json.load(f)
                    self.results = data if isinstance(data, list) else [data]
                self.logger.info(f"Detected {len(self.results)} anomalies")
            
            return True
        
        except subprocess.TimeoutExpired:
            self.logger.error("Timeout")
            self.process.kill()
            return False
    
    def get_results(self) -> List[Dict[str, Any]]:
        """Retrieve detection results"""
        return self.results


class PartyTownBrowserChecker:
    """Verify PartyTown blocker installation"""
    
    def __init__(self, config: DefenseSuiteConfig):
        self.config = config
        self.logger = setup_logger('PartyTown')
        self.status = "UNCHECKED"
    
    def verify(self) -> bool:
        """Check if PartyTown blocker installed"""
        if not self.config.browser_blocker_enabled:
            self.logger.info("Skipped (disabled)")
            return True
        
        if self.config.browser_method == "tampermonkey":
            self.logger.info("Tampermonkey script: Manual verification required")
            self.status = "PENDING_VERIFICATION"
            return True
        
        elif self.config.browser_method == "ublock":
            self.logger.info("uBlock Origin rules: Check browser extension")
            self.status = "PENDING_VERIFICATION"
            return True
        
        return False
    
    def get_status(self) -> str:
        """Retrieve installation status"""
        return self.status

# ============================================================================
# ORCHESTRATION ENGINE
# ============================================================================

class DefenseSuiteOrchestrator:
    """Master controller for all four defense layers"""
    
    def __init__(self, config: DefenseSuiteConfig):
        self.config = config
        self.logger = setup_logger('Orchestrator')
        
        # Create output directory
        Path(config.output_dir).mkdir(parents=True, exist_ok=True)
        
        # Initialize executors
        self.tube_sdr = TubeSDRExecutor(config)
        self.marconi = MarconiExecutor(config)
        self.modbus = ModbusExecutor(config)
        self.browser = PartyTownBrowserChecker(config)
        
        self.start_time = None
        self.end_time = None
    
    def run(self) -> bool:
        """Execute full defense suite"""
        self.logger.info("=" * 70)
        self.logger.info("CONGUSTO-EITEL Defense Suite - STARTING")
        self.logger.info("=" * 70)
        
        self.start_time = datetime.now()
        
        # Phase 1: Start all tools
        self.logger.info("\n[PHASE 1] STARTING TOOLS")
        self.logger.info("-" * 70)
        
        self.logger.info("RF Layer: Tube-SDR Demodulator")
        tube_ok = self.tube_sdr.start()
        
        self.logger.info("Temporal Layer: Marconi Spark Correlator")
        marconi_ok = self.marconi.start()
        
        self.logger.info("Network Layer: Modbus Sentinel")
        modbus_ok = self.modbus.start()
        
        self.logger.info("Browser Layer: PartyTown Blocker")
        browser_ok = self.browser.verify()
        
        if not all([tube_ok, marconi_ok, modbus_ok, browser_ok]):
            self.logger.error("Failed to start all tools")
            return False
        
        # Phase 2: Wait for completion
        self.logger.info("\n[PHASE 2] MONITORING EXECUTION")
        self.logger.info("-" * 70)
        
        tube_done = self.tube_sdr.wait(self.config.timeout_seconds)
        marconi_done = self.marconi.wait(self.config.timeout_seconds)
        modbus_done = self.modbus.wait(self.config.timeout_seconds)
        
        if not all([tube_done, marconi_done, modbus_done]):
            self.logger.error("One or more tools failed to complete")
            return False
        
        # Phase 3: Correlation & Analysis
        self.logger.info("\n[PHASE 3] CORRELATION & ANALYSIS")
        self.logger.info("-" * 70)
        
        if self.config.correlation_enabled:
            self._correlate_results()
        
        # Phase 4: Generate Report
        self.logger.info("\n[PHASE 4] REPORT GENERATION")
        self.logger.info("-" * 70)
        
        self._generate_report()
        
        self.end_time = datetime.now()
        duration = (self.end_time - self.start_time).total_seconds()
        
        self.logger.info("\n" + "=" * 70)
        self.logger.info("CONGUSTO-EITEL Defense Suite - COMPLETE")
        self.logger.info(f"Duration: {duration:.2f} seconds")
        self.logger.info("=" * 70)
        
        return True
    
    def _correlate_results(self):
        """Cross-correlate detections across layers"""
        self.logger.info("Analyzing correlation patterns...")
        
        tube_results = self.tube_sdr.get_results()
        marconi_results = self.marconi.get_results()
        modbus_results = self.modbus.get_results()
        
        # Count detections
        self.logger.info(f"RF Layer: {len(tube_results)} detections")
        self.logger.info(f"Temporal Layer: Analysis complete (coherence={marconi_results.get('coherence_score', 'N/A')})")
        self.logger.info(f"Network Layer: {len(modbus_results)} anomalies")
        
        # Threat level calculation
        threat_level = self._calculate_threat_level(
            len(tube_results),
            marconi_results.get('coherence_score', 0),
            len(modbus_results)
        )
        
        self.logger.info(f"\nThreat Level: {threat_level}")
        
        if threat_level >= 0.8:
            self.logger.critical("⚠️  HIGH CONFIDENCE ORGANIZED ATTACK DETECTED")
    
    def _calculate_threat_level(self, 
                               tube_detections: int, 
                               marconi_coherence: float, 
                               modbus_anomalies: int) -> float:
        """Calculate composite threat level (0.0-1.0)"""
        
        # Normalize components
        tube_score = min(tube_detections / 10.0, 1.0) * 0.3
        marconi_score = (marconi_coherence / 100.0) * 0.4
        modbus_score = min(modbus_anomalies / 5.0, 1.0) * 0.3
        
        return tube_score + marconi_score + modbus_score
    
    def _generate_report(self):
        """Generate unified threat report"""
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "duration_seconds": (self.end_time - self.start_time).total_seconds(),
            "layers": {
                "rf": {
                    "tool": "Tube-SDR Demodulator",
                    "enabled": self.config.tube_sdr_enabled,
                    "detections": len(self.tube_sdr.get_results()),
                    "results": self.tube_sdr.get_results()
                },
                "temporal": {
                    "tool": "Marconi Spark Correlator",
                    "enabled": self.config.marconi_enabled,
                    "results": self.marconi.get_results()
                },
                "network": {
                    "tool": "Modbus Sentinel",
                    "enabled": self.config.modbus_enabled,
                    "anomalies": len(self.modbus.get_results()),
                    "results": self.modbus.get_results()
                },
                "browser": {
                    "tool": "PartyTown Blocker",
                    "enabled": self.config.browser_blocker_enabled,
                    "status": self.browser.get_status()
                }
            }
        }
        
        # Save JSON report
        report_path = os.path.join(self.config.output_dir, "unified_threat_report.json")
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        self.logger.info(f"Report saved: {report_path}")
        
        # Save human-readable report
        text_report_path = os.path.join(self.config.output_dir, "threat_summary.txt")
        with open(text_report_path, 'w') as f:
            f.write("=" * 70 + "\n")
            f.write("CONGUSTO-EITEL Defense Suite - Unified Threat Report\n")
            f.write("=" * 70 + "\n\n")
            
            f.write(f"Timestamp: {report['timestamp']}\n")
            f.write(f"Total Duration: {report['duration_seconds']:.2f}s\n\n")
            
            f.write("RF LAYER (Tube-SDR Demodulator)\n")
            f.write("-" * 70 + "\n")
            f.write(f"Status: {'ENABLED' if self.config.tube_sdr_enabled else 'DISABLED'}\n")
            f.write(f"Detections: {report['layers']['rf']['detections']}\n\n")
            
            f.write("TEMPORAL LAYER (Marconi Spark Correlator)\n")
            f.write("-" * 70 + "\n")
            f.write(f"Status: {'ENABLED' if self.config.marconi_enabled else 'DISABLED'}\n")
            coherence = report['layers']['temporal']['results'].get('coherence_score', 'N/A')
            f.write(f"Coherence Score: {coherence}\n\n")
            
            f.write("NETWORK LAYER (Modbus Sentinel)\n")
            f.write("-" * 70 + "\n")
            f.write(f"Status: {'ENABLED' if self.config.modbus_enabled else 'DISABLED'}\n")
            f.write(f"Anomalies: {report['layers']['network']['anomalies']}\n\n")
            
            f.write("BROWSER LAYER (PartyTown Blocker)\n")
            f.write("-" * 70 + "\n")
            f.write(f"Status: {report['layers']['browser']['status']}\n\n")
        
        self.logger.info(f"Summary saved: {text_report_path}")

# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="CONGUSTO-EITEL Defense Suite Master Orchestrator"
    )
    
    parser.add_argument('--tube-sdr', action='store_true', default=True, 
                       help='Enable Tube-SDR layer')
    parser.add_argument('--marconi', action='store_true', default=True,
                       help='Enable Marconi Correlator layer')
    parser.add_argument('--modbus', action='store_true', default=True,
                       help='Enable Modbus Sentinel layer')
    parser.add_argument('--browser', action='store_true', default=True,
                       help='Enable PartyTown Blocker verification')
    
    parser.add_argument('--tube-freq', type=float, default=1000.0,
                       help='Tube-SDR frequency (Hz)')
    parser.add_argument('--tube-gain', type=float, default=1000.0,
                       help='Tube-SDR gain factor')
    parser.add_argument('--tube-duration', type=float, default=60.0,
                       help='Tube-SDR monitoring duration (s)')
    
    parser.add_argument('--marconi-period', type=float, default=21.333,
                       help='Marconi period (ms)')
    parser.add_argument('--marconi-stacks', type=int, default=100,
                       help='Marconi number of stacks')
    parser.add_argument('--marconi-duration', type=float, default=60.0,
                       help='Marconi monitoring duration (s)')
    
    parser.add_argument('--modbus-port', type=int, default=502,
                       help='Modbus TCP port')
    parser.add_argument('--modbus-heartbeat', type=float, default=21.333,
                       help='Modbus heartbeat period (ms)')
    
    parser.add_argument('--timeout', type=int, default=120,
                       help='Tool execution timeout (seconds)')
    parser.add_argument('--output-dir', type=str, default='./defense_results',
                       help='Output directory for reports')
    parser.add_argument('--log-level', type=str, default='INFO',
                       choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                       help='Logging level')
    
    args = parser.parse_args()
    
    # Build configuration
    config = DefenseSuiteConfig(
        tube_sdr_enabled=args.tube_sdr,
        tube_sdr_frequency=args.tube_freq,
        tube_sdr_gain=args.tube_gain,
        tube_sdr_duration=args.tube_duration,
        
        marconi_enabled=args.marconi,
        marconi_period=args.marconi_period,
        marconi_num_stacks=args.marconi_stacks,
        marconi_duration=args.marconi_duration,
        
        modbus_enabled=args.modbus,
        modbus_port=args.modbus_port,
        modbus_heartbeat_period=args.modbus_heartbeat,
        
        browser_blocker_enabled=args.browser,
        
        output_dir=args.output_dir,
        log_level=args.log_level,
        timeout_seconds=args.timeout
    )
    
    # Run orchestrator
    orchestrator = DefenseSuiteOrchestrator(config)
    success = orchestrator.run()
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
