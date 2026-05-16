#!/usr/bin/env python3
"""
PCAP Threat Analyzer - V2K/C2/RAT Detection
Analyzes network captures for:
- Command & Control (C2) patterns
- Remote Access Trojan (RAT) indicators
- Beaconing behavior
- Unusual protocols/ports
- DNS tunneling
- Covert channels
- V2K-related RF/streaming patterns
"""

import sys
import os
from collections import defaultdict, Counter
from datetime import datetime
import json

try:
    import pyshark
except ImportError:
    print("Installing pyshark...")
    os.system("pip install pyshark")
    import pyshark

# Known malicious/suspicious indicators
SUSPICIOUS_PORTS = {
    4444: "Metasploit default",
    5555: "Android ADB",
    1337: "Common backdoor",
    31337: "Back Orifice",
    12345: "NetBus",
    54321: "Back Orifice 2000",
    6666: "IRC backdoor",
    6667: "IRC (common C2)",
    6697: "IRC SSL",
    8080: "Alt HTTP (proxy/C2)",
    8443: "Alt HTTPS",
    9001: "Tor default",
    9050: "Tor SOCKS",
    9051: "Tor control",
    3389: "RDP",
    5900: "VNC",
    5901: "VNC",
    22: "SSH (check if expected)",
    23: "Telnet (insecure)",
    445: "SMB",
    135: "RPC",
    137: "NetBIOS",
    138: "NetBIOS",
    139: "NetBIOS",
    1080: "SOCKS proxy",
    3128: "Squid proxy",
    8888: "Alt proxy",
}

# Known C2 domains/patterns
C2_PATTERNS = [
    "duckdns.org", "no-ip.com", "ddns.net", "hopto.org",
    "zapto.org", "sytes.net", "serveftp.com", "servegame.com",
    "ngrok.io", "pagekite.me", "portmap.io", "localhost.run",
    "serveo.net", "cloudflare-dns.com",
]

# Streaming/audio ports (V2K vectors)
AUDIO_STREAMING_PORTS = {
    554: "RTSP",
    1935: "RTMP",
    8554: "Alt RTSP",
    5004: "RTP",
    5005: "RTP",
    1755: "MMS",
    7070: "RealAudio",
}

class ThreatAnalyzer:
    def __init__(self):
        self.connections = defaultdict(list)
        self.dns_queries = []
        self.suspicious_findings = []
        self.ip_stats = Counter()
        self.port_stats = Counter()
        self.protocol_stats = Counter()
        self.beacons = defaultdict(list)
        self.data_exfil = []
        self.streaming = []
        
    def analyze_packet(self, pkt):
        try:
            # Get timestamp
            ts = float(pkt.sniff_timestamp)
            
            # Track protocols
            protocols = []
            for layer in pkt.layers:
                protocols.append(layer.layer_name.upper())
            self.protocol_stats.update(protocols)
            
            # IP layer analysis
            if hasattr(pkt, 'ip'):
                src = pkt.ip.src
                dst = pkt.ip.dst
                self.ip_stats[src] += 1
                self.ip_stats[dst] += 1
                
                # Check for suspicious IPs (non-RFC1918 + high volume)
                if not self._is_private_ip(dst):
                    self.connections[f"{src}->{dst}"].append(ts)
                    
            # TCP/UDP port analysis
            if hasattr(pkt, 'tcp'):
                sport = int(pkt.tcp.srcport)
                dport = int(pkt.tcp.dstport)
                self._check_port(sport, src if hasattr(pkt, 'ip') else "unknown", ts, "TCP")
                self._check_port(dport, dst if hasattr(pkt, 'ip') else "unknown", ts, "TCP")
                
                # Check for data exfiltration (large outbound)
                if hasattr(pkt, 'ip') and hasattr(pkt.tcp, 'len'):
                    try:
                        payload_len = int(pkt.tcp.len)
                        if payload_len > 1000 and not self._is_private_ip(dst):
                            self.data_exfil.append({
                                'src': src, 'dst': dst, 'port': dport,
                                'size': payload_len, 'time': ts
                            })
                    except: pass
                    
            if hasattr(pkt, 'udp'):
                sport = int(pkt.udp.srcport)
                dport = int(pkt.udp.dstport)
                self._check_port(sport, src if hasattr(pkt, 'ip') else "unknown", ts, "UDP")
                self._check_port(dport, dst if hasattr(pkt, 'ip') else "unknown", ts, "UDP")
                
            # DNS analysis
            if hasattr(pkt, 'dns'):
                self._analyze_dns(pkt)
                
            # HTTP analysis
            if hasattr(pkt, 'http'):
                self._analyze_http(pkt)
                
            # Check for streaming protocols (V2K vector)
            if hasattr(pkt, 'rtsp') or hasattr(pkt, 'rtp'):
                self.streaming.append({
                    'proto': 'RTSP/RTP',
                    'time': ts,
                    'src': pkt.ip.src if hasattr(pkt, 'ip') else 'unknown',
                    'dst': pkt.ip.dst if hasattr(pkt, 'ip') else 'unknown'
                })
                
        except Exception as e:
            pass  # Skip malformed packets
            
    def _is_private_ip(self, ip):
        """Check if IP is RFC1918 private"""
        if ip.startswith('10.') or ip.startswith('192.168.'):
            return True
        if ip.startswith('172.'):
            parts = ip.split('.')
            if len(parts) > 1 and 16 <= int(parts[1]) <= 31:
                return True
        if ip.startswith('127.') or ip.startswith('169.254.'):
            return True
        return False
        
    def _check_port(self, port, ip, ts, proto):
        self.port_stats[port] += 1
        
        if port in SUSPICIOUS_PORTS:
            self.suspicious_findings.append({
                'type': 'SUSPICIOUS_PORT',
                'port': port,
                'ip': ip,
                'reason': SUSPICIOUS_PORTS[port],
                'proto': proto,
                'time': ts
            })
            
        if port in AUDIO_STREAMING_PORTS:
            self.streaming.append({
                'proto': AUDIO_STREAMING_PORTS[port],
                'port': port,
                'ip': ip,
                'time': ts
            })
            
    def _analyze_dns(self, pkt):
        try:
            if hasattr(pkt.dns, 'qry_name'):
                domain = pkt.dns.qry_name.lower()
                self.dns_queries.append(domain)
                
                # Check for C2 patterns
                for pattern in C2_PATTERNS:
                    if pattern in domain:
                        self.suspicious_findings.append({
                            'type': 'C2_DOMAIN',
                            'domain': domain,
                            'pattern': pattern,
                            'time': float(pkt.sniff_timestamp)
                        })
                        
                # Check for DNS tunneling (very long subdomains)
                parts = domain.split('.')
                for part in parts:
                    if len(part) > 50:
                        self.suspicious_findings.append({
                            'type': 'DNS_TUNNELING',
                            'domain': domain,
                            'reason': f'Unusually long subdomain: {len(part)} chars',
                            'time': float(pkt.sniff_timestamp)
                        })
                        break
                        
                # High entropy domain names (DGA)
                if self._high_entropy(parts[0]) and len(parts[0]) > 10:
                    self.suspicious_findings.append({
                        'type': 'POSSIBLE_DGA',
                        'domain': domain,
                        'reason': 'High entropy domain (possible DGA)',
                        'time': float(pkt.sniff_timestamp)
                    })
                    
        except: pass
        
    def _analyze_http(self, pkt):
        try:
            if hasattr(pkt.http, 'host'):
                host = pkt.http.host
                for pattern in C2_PATTERNS:
                    if pattern in host.lower():
                        self.suspicious_findings.append({
                            'type': 'C2_HTTP_HOST',
                            'host': host,
                            'pattern': pattern,
                            'time': float(pkt.sniff_timestamp)
                        })
                        
            # Check for suspicious user agents
            if hasattr(pkt.http, 'user_agent'):
                ua = pkt.http.user_agent.lower()
                suspicious_ua = ['curl', 'wget', 'python', 'powershell', 'nmap', 'nikto', 'sqlmap']
                for s in suspicious_ua:
                    if s in ua:
                        self.suspicious_findings.append({
                            'type': 'SUSPICIOUS_USER_AGENT',
                            'user_agent': pkt.http.user_agent,
                            'time': float(pkt.sniff_timestamp)
                        })
                        break
        except: pass
        
    def _high_entropy(self, s):
        """Check if string has high entropy (random-looking)"""
        if not s: return False
        from collections import Counter
        import math
        counts = Counter(s)
        length = len(s)
        entropy = -sum((c/length) * math.log2(c/length) for c in counts.values())
        return entropy > 3.5  # Threshold for "random-looking"
        
    def detect_beaconing(self):
        """Detect regular interval communications (C2 beaconing)"""
        beacons = []
        for conn, timestamps in self.connections.items():
            if len(timestamps) < 5:
                continue
            timestamps.sort()
            intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]
            
            if not intervals:
                continue
                
            avg_interval = sum(intervals) / len(intervals)
            if avg_interval < 1:  # Less than 1 second average
                continue
                
            # Check if intervals are consistent (std dev < 20% of mean)
            variance = sum((i - avg_interval)**2 for i in intervals) / len(intervals)
            std_dev = variance ** 0.5
            
            if std_dev < avg_interval * 0.2:  # Low variance = beaconing
                beacons.append({
                    'connection': conn,
                    'count': len(timestamps),
                    'avg_interval_sec': round(avg_interval, 2),
                    'std_dev': round(std_dev, 2)
                })
                
        return beacons
        
    def generate_report(self):
        beacons = self.detect_beaconing()
        
        report = {
            'summary': {
                'total_ips': len(self.ip_stats),
                'total_connections': len(self.connections),
                'suspicious_findings': len(self.suspicious_findings),
                'dns_queries': len(self.dns_queries),
                'streaming_detected': len(self.streaming),
                'potential_beacons': len(beacons),
                'data_exfil_events': len(self.data_exfil)
            },
            'top_talkers': self.ip_stats.most_common(20),
            'top_ports': self.port_stats.most_common(30),
            'protocols': dict(self.protocol_stats),
            'suspicious_findings': self.suspicious_findings[:50],  # First 50
            'beaconing_detected': beacons[:10],
            'streaming_audio_video': self.streaming[:20],
            'unique_dns_domains': list(set(self.dns_queries))[:100],
            'data_exfiltration': self.data_exfil[:20]
        }
        
        return report


def analyze_pcap(filepath):
    print(f"\n{'='*60}")
    print(f"ANALYZING: {filepath}")
    print(f"{'='*60}")
    
    if not os.path.exists(filepath):
        print(f"ERROR: File not found: {filepath}")
        return None
        
    filesize = os.path.getsize(filepath) / (1024*1024)
    print(f"File size: {filesize:.2f} MB")
    
    analyzer = ThreatAnalyzer()
    
    try:
        # Use tshark for faster processing
        cap = pyshark.FileCapture(filepath, use_json=True, include_raw=False)
        cap.set_debug()
        
        count = 0
        for pkt in cap:
            analyzer.analyze_packet(pkt)
            count += 1
            if count % 1000 == 0:
                print(f"  Processed {count} packets...")
            if count > 100000:  # Limit for large files
                print("  (Limited to first 100,000 packets)")
                break
                
        cap.close()
        print(f"  Total packets analyzed: {count}")
        
    except Exception as e:
        print(f"ERROR processing pcap: {e}")
        print("Trying alternative method...")
        
        try:
            # Fallback to scapy
            from scapy.all import rdpcap, IP, TCP, UDP, DNS
            packets = rdpcap(filepath)
            print(f"  Loaded {len(packets)} packets with scapy")
            
            for pkt in packets[:100000]:
                try:
                    if IP in pkt:
                        src = pkt[IP].src
                        dst = pkt[IP].dst
                        analyzer.ip_stats[src] += 1
                        analyzer.ip_stats[dst] += 1
                        
                        if TCP in pkt:
                            analyzer.port_stats[pkt[TCP].sport] += 1
                            analyzer.port_stats[pkt[TCP].dport] += 1
                            analyzer._check_port(pkt[TCP].dport, dst, 0, "TCP")
                            
                        if UDP in pkt:
                            analyzer.port_stats[pkt[UDP].sport] += 1
                            analyzer.port_stats[pkt[UDP].dport] += 1
                            analyzer._check_port(pkt[UDP].dport, dst, 0, "UDP")
                            
                        if DNS in pkt and pkt[DNS].qd:
                            domain = pkt[DNS].qd.qname.decode() if hasattr(pkt[DNS].qd.qname, 'decode') else str(pkt[DNS].qd.qname)
                            analyzer.dns_queries.append(domain)
                except: pass
                
        except Exception as e2:
            print(f"Scapy also failed: {e2}")
            return None
            
    return analyzer.generate_report()


def print_report(report, filename):
    if not report:
        return
        
    print(f"\n{'='*60}")
    print(f"THREAT ANALYSIS REPORT: {filename}")
    print(f"{'='*60}")
    
    s = report['summary']
    print(f"\n📊 SUMMARY:")
    print(f"   Total IPs seen:        {s['total_ips']}")
    print(f"   Total connections:     {s['total_connections']}")
    print(f"   DNS queries:           {s['dns_queries']}")
    print(f"   Streaming detected:    {s['streaming_detected']}")
    print(f"   Potential beacons:     {s['potential_beacons']}")
    print(f"   Data exfil events:     {s['data_exfil_events']}")
    print(f"   ⚠️  SUSPICIOUS FINDINGS: {s['suspicious_findings']}")
    
    if report['suspicious_findings']:
        print(f"\n🚨 SUSPICIOUS FINDINGS:")
        for finding in report['suspicious_findings'][:15]:
            print(f"   [{finding['type']}]")
            for k, v in finding.items():
                if k != 'type':
                    print(f"      {k}: {v}")
            print()
            
    if report['beaconing_detected']:
        print(f"\n📡 BEACONING DETECTED (C2 Indicator):")
        for beacon in report['beaconing_detected']:
            print(f"   {beacon['connection']}")
            print(f"      Count: {beacon['count']}, Interval: {beacon['avg_interval_sec']}s ±{beacon['std_dev']}s")
            
    if report['streaming_audio_video']:
        print(f"\n🎤 STREAMING/AUDIO PROTOCOLS (V2K Vector):")
        for stream in report['streaming_audio_video'][:10]:
            print(f"   {stream}")
            
    print(f"\n📡 TOP TALKERS (IPs with most traffic):")
    for ip, count in report['top_talkers'][:10]:
        print(f"   {ip}: {count} packets")
        
    print(f"\n🔌 TOP PORTS:")
    for port, count in report['top_ports'][:15]:
        note = SUSPICIOUS_PORTS.get(port, AUDIO_STREAMING_PORTS.get(port, ""))
        flag = " ⚠️" if port in SUSPICIOUS_PORTS else ""
        flag = " 🎤" if port in AUDIO_STREAMING_PORTS else flag
        print(f"   {port}: {count} hits {note}{flag}")
        
    if report['unique_dns_domains']:
        print(f"\n🌐 UNIQUE DNS DOMAINS ({len(report['unique_dns_domains'])} total, showing first 20):")
        for domain in report['unique_dns_domains'][:20]:
            for pattern in C2_PATTERNS:
                if pattern in domain.lower():
                    print(f"   ⚠️  {domain} [MATCHES C2 PATTERN: {pattern}]")
                    break
            else:
                print(f"   {domain}")
                
    return report


if __name__ == "__main__":
    pcaps = [
        r"c:\Users\echo\Downloads\LLM\ToroidalRecursion\nice.pcap",
        r"c:\Users\echo\Downloads\LLM\ToroidalRecursion\nic2.pcap"
    ]
    
    all_reports = {}
    
    for pcap_file in pcaps:
        report = analyze_pcap(pcap_file)
        if report:
            all_reports[os.path.basename(pcap_file)] = report
            print_report(report, os.path.basename(pcap_file))
            
    # Save combined report
    output_file = r"c:\Users\echo\Downloads\LLM\ToroidalRecursion\pcap_threat_report.json"
    with open(output_file, 'w') as f:
        json.dump(all_reports, f, indent=2, default=str)
    print(f"\n✅ Full report saved to: {output_file}")
