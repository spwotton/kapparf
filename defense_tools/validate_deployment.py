#!/usr/bin/env python3
"""
Defense Suite Installation & Deployment Validator
Verifies all four tools are present, have correct dependencies, and can execute.

Usage:
    python validate_deployment.py [--test] [--verbose]
"""

import os
import sys
import json
import subprocess
import importlib
from pathlib import Path
from typing import Dict, List, Tuple
import logging

# ============================================================================
# LOGGING
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# VALIDATION CHECKLIST
# ============================================================================

class ValidationReport:
    """Comprehensive deployment validation report"""
    
    def __init__(self):
        self.checks: Dict[str, Dict[str, any]] = {}
        self.passed = 0
        self.failed = 0
        self.warnings = 0
    
    def add_check(self, category: str, name: str, status: str, message: str = ""):
        """Record validation result"""
        if category not in self.checks:
            self.checks[category] = {}
        
        self.checks[category][name] = {
            'status': status,  # PASS, FAIL, WARNING
            'message': message
        }
        
        if status == 'PASS':
            self.passed += 1
        elif status == 'FAIL':
            self.failed += 1
        elif status == 'WARNING':
            self.warnings += 1
    
    def print_report(self):
        """Display formatted report"""
        print("\n" + "=" * 80)
        print("CONGUSTO-EITEL DEFENSE SUITE - DEPLOYMENT VALIDATION REPORT")
        print("=" * 80 + "\n")
        
        for category, checks in self.checks.items():
            print(f"\n[{category}]")
            print("-" * 80)
            
            for name, result in checks.items():
                status_symbol = {
                    'PASS': '✓',
                    'FAIL': '✗',
                    'WARNING': '⚠'
                }.get(result['status'], '?')
                
                print(f"  {status_symbol} {name:50s} {result['status']}")
                if result['message']:
                    print(f"     → {result['message']}")
        
        print("\n" + "=" * 80)
        print(f"SUMMARY: {self.passed} passed, {self.failed} failed, {self.warnings} warnings")
        print("=" * 80 + "\n")
        
        if self.failed == 0:
            print("✓ DEPLOYMENT READY")
            return True
        else:
            print("✗ DEPLOYMENT ISSUES DETECTED")
            return False

# ============================================================================
# VALIDATORS
# ============================================================================

class EnvironmentValidator:
    """Check Python environment"""
    
    def __init__(self):
        self.report = ValidationReport()
    
    def validate(self) -> bool:
        """Run environment checks"""
        logger.info("Validating environment...")
        
        # Python version
        py_version = f"{sys.version_info.major}.{sys.version_info.minor}"
        if sys.version_info >= (3, 8):
            self.report.add_check(
                'Environment', 
                f'Python {py_version}',
                'PASS'
            )
        else:
            self.report.add_check(
                'Environment',
                f'Python {py_version}',
                'FAIL',
                'Python 3.8+ required'
            )
        
        # Operating system
        os_name = sys.platform
        self.report.add_check(
            'Environment',
            f'OS: {os_name}',
            'PASS' if os_name in ['linux', 'darwin', 'win32'] else 'WARNING',
            'Tested on Linux, macOS, Windows'
        )
        
        return self.report.failed == 0


class DependencyValidator:
    """Check Python package dependencies"""
    
    REQUIRED_PACKAGES = {
        'numpy': 'Numerical computing',
        'scipy': 'Scientific computing',
    }
    
    OPTIONAL_PACKAGES = {
        'scapy': 'Packet manipulation (for live Modbus capture)',
        'pyrtlsdr': 'RTL-SDR device support',
    }
    
    def __init__(self):
        self.report = ValidationReport()
    
    def validate(self) -> bool:
        """Check all dependencies"""
        logger.info("Validating dependencies...")
        
        # Required packages
        for package, description in self.REQUIRED_PACKAGES.items():
            try:
                importlib.import_module(package)
                self.report.add_check(
                    'Dependencies',
                    f'{package}',
                    'PASS',
                    description
                )
            except ImportError:
                self.report.add_check(
                    'Dependencies',
                    f'{package}',
                    'FAIL',
                    f'Install: pip install {package}'
                )
        
        # Optional packages
        for package, description in self.OPTIONAL_PACKAGES.items():
            try:
                importlib.import_module(package)
                self.report.add_check(
                    'Optional',
                    f'{package}',
                    'PASS',
                    description
                )
            except ImportError:
                self.report.add_check(
                    'Optional',
                    f'{package}',
                    'WARNING',
                    f'Optional - install: pip install {package}'
                )
        
        return self.report.failed == 0


class ToolValidator:
    """Check defense tool files"""
    
    REQUIRED_TOOLS = {
        'tube_sdr_demodulator.py': 'RF layer (Tube-SDR)',
        'marconi_spark_correlator.py': 'Temporal layer (Marconi)',
        'modbus_sentinel.py': 'Network layer (IDS)',
        'partytown_blocker.user.js': 'Browser layer (Tampermonkey)',
        'partytown_blocker.ublock.txt': 'Browser layer (uBlock)',
    }
    
    def __init__(self, tool_dir: str = '.'):
        self.tool_dir = Path(tool_dir)
        self.report = ValidationReport()
    
    def validate(self) -> bool:
        """Check all tool files"""
        logger.info(f"Validating tools in: {self.tool_dir}")
        
        for filename, description in self.REQUIRED_TOOLS.items():
            filepath = self.tool_dir / filename
            
            if filepath.exists():
                size_kb = filepath.stat().st_size / 1024
                self.report.add_check(
                    'Tools',
                    filename,
                    'PASS',
                    f'{description} ({size_kb:.1f} KB)'
                )
            else:
                self.report.add_check(
                    'Tools',
                    filename,
                    'FAIL',
                    f'Missing - {description}'
                )
        
        return self.report.failed == 0


class SyntaxValidator:
    """Check Python tool syntax"""
    
    def __init__(self, tool_dir: str = '.'):
        self.tool_dir = Path(tool_dir)
        self.report = ValidationReport()
    
    def validate(self) -> bool:
        """Validate Python syntax"""
        logger.info("Validating Python syntax...")
        
        python_files = [
            'tube_sdr_demodulator.py',
            'marconi_spark_correlator.py',
            'modbus_sentinel.py',
            'defense_suite_controller.py'
        ]
        
        for filename in python_files:
            filepath = self.tool_dir / filename
            
            if not filepath.exists():
                continue
            
            try:
                with open(filepath, 'r') as f:
                    compile(f.read(), filename, 'exec')
                
                self.report.add_check(
                    'Syntax',
                    filename,
                    'PASS'
                )
            except SyntaxError as e:
                self.report.add_check(
                    'Syntax',
                    filename,
                    'FAIL',
                    f'Line {e.lineno}: {e.msg}'
                )
        
        return self.report.failed == 0


class ExecutionValidator:
    """Test tool execution with --help"""
    
    def __init__(self, tool_dir: str = '.'):
        self.tool_dir = Path(tool_dir)
        self.report = ValidationReport()
    
    def validate(self) -> bool:
        """Test execution"""
        logger.info("Testing tool execution...")
        
        python_tools = [
            'tube_sdr_demodulator.py',
            'marconi_spark_correlator.py',
            'modbus_sentinel.py',
            'defense_suite_controller.py'
        ]
        
        for filename in python_tools:
            filepath = self.tool_dir / filename
            
            if not filepath.exists():
                continue
            
            try:
                result = subprocess.run(
                    [sys.executable, str(filepath), '--help'],
                    capture_output=True,
                    timeout=5,
                    text=True
                )
                
                if result.returncode == 0:
                    self.report.add_check(
                        'Execution',
                        filename,
                        'PASS',
                        'CLI interface working'
                    )
                else:
                    self.report.add_check(
                        'Execution',
                        filename,
                        'FAIL',
                        f'Exit code: {result.returncode}'
                    )
            
            except subprocess.TimeoutExpired:
                self.report.add_check(
                    'Execution',
                    filename,
                    'FAIL',
                    'Execution timeout'
                )
            except Exception as e:
                self.report.add_check(
                    'Execution',
                    filename,
                    'FAIL',
                    str(e)
                )
        
        return self.report.failed == 0


class ConfigurationValidator:
    """Check configuration files"""
    
    def __init__(self, tool_dir: str = '.'):
        self.tool_dir = Path(tool_dir)
        self.report = ValidationReport()
    
    def validate(self) -> bool:
        """Validate configuration"""
        logger.info("Validating configuration...")
        
        # Check README
        readme = self.tool_dir / 'README.md'
        if readme.exists():
            self.report.add_check(
                'Configuration',
                'README.md',
                'PASS',
                'Deployment guide present'
            )
        else:
            self.report.add_check(
                'Configuration',
                'README.md',
                'WARNING',
                'No deployment documentation'
            )
        
        # Check output directory
        output_dir = self.tool_dir / 'defense_results'
        if output_dir.exists():
            self.report.add_check(
                'Configuration',
                'Output directory',
                'PASS'
            )
        else:
            try:
                output_dir.mkdir(parents=True, exist_ok=True)
                self.report.add_check(
                    'Configuration',
                    'Output directory',
                    'PASS',
                    f'Created: {output_dir}'
                )
            except Exception as e:
                self.report.add_check(
                    'Configuration',
                    'Output directory',
                    'WARNING',
                    f'Could not create: {e}'
                )
        
        return True


class IntegrationValidator:
    """Test minimal integration"""
    
    def __init__(self):
        self.report = ValidationReport()
    
    def validate(self) -> bool:
        """Run minimal integration tests"""
        logger.info("Testing integration...")
        
        # Test 1: Import main modules
        try:
            import numpy as np
            import scipy
            
            # Simple numpy operation
            arr = np.array([1, 2, 3])
            result = np.tanh(arr)
            
            self.report.add_check(
                'Integration',
                'NumPy operations',
                'PASS',
                'Core DSP operations working'
            )
        except Exception as e:
            self.report.add_check(
                'Integration',
                'NumPy operations',
                'FAIL',
                str(e)
            )
        
        # Test 2: Synthetic data generation
        try:
            import numpy as np
            sample_rate = 48000
            duration = 0.1
            t = np.linspace(0, duration, int(sample_rate * duration))
            freq = 46.875
            signal = np.sin(2 * np.pi * freq * t)
            
            self.report.add_check(
                'Integration',
                'Synthetic signal generation',
                'PASS',
                f'Generated {len(signal)} samples @ {sample_rate}Hz'
            )
        except Exception as e:
            self.report.add_check(
                'Integration',
                'Synthetic signal generation',
                'FAIL',
                str(e)
            )
        
        return self.report.failed == 0


# ============================================================================
# MAIN VALIDATION WORKFLOW
# ============================================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Defense Suite Installation & Deployment Validator'
    )
    parser.add_argument('--test', action='store_true',
                       help='Run integration tests')
    parser.add_argument('--verbose', action='store_true',
                       help='Verbose output')
    parser.add_argument('--tool-dir', type=str, default='.',
                       help='Tool directory path')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Get tool directory
    tool_dir = Path(args.tool_dir).resolve()
    
    if not tool_dir.exists():
        logger.error(f"Tool directory not found: {tool_dir}")
        return 1
    
    # Run all validators
    all_passed = True
    
    # 1. Environment
    env_validator = EnvironmentValidator()
    env_validator.validate()
    env_validator.report.print_report()
    all_passed &= env_validator.report.failed == 0
    
    # 2. Dependencies
    dep_validator = DependencyValidator()
    dep_validator.validate()
    dep_validator.report.print_report()
    all_passed &= dep_validator.report.failed == 0
    
    # 3. Tools
    tool_validator = ToolValidator(tool_dir)
    tool_validator.validate()
    tool_validator.report.print_report()
    all_passed &= tool_validator.report.failed == 0
    
    # 4. Syntax
    syntax_validator = SyntaxValidator(tool_dir)
    syntax_validator.validate()
    syntax_validator.report.print_report()
    all_passed &= syntax_validator.report.failed == 0
    
    # 5. Execution
    exec_validator = ExecutionValidator(tool_dir)
    exec_validator.validate()
    exec_validator.report.print_report()
    all_passed &= exec_validator.report.failed == 0
    
    # 6. Configuration
    config_validator = ConfigurationValidator(tool_dir)
    config_validator.validate()
    config_validator.report.print_report()
    
    # 7. Integration (if --test)
    if args.test:
        logger.info("\nRunning integration tests...")
        integration_validator = IntegrationValidator()
        integration_validator.validate()
        integration_validator.report.print_report()
        all_passed &= integration_validator.report.failed == 0
    
    # Final summary
    print("\n" + "=" * 80)
    if all_passed:
        print("✓ DEPLOYMENT VALIDATION SUCCESSFUL")
        print("\nNext steps:")
        print("  1. Review README.md for deployment procedures")
        print("  2. Configure tool parameters (frequency, ports, etc.)")
        print("  3. Run: python defense_suite_controller.py")
        return 0
    else:
        print("✗ DEPLOYMENT VALIDATION FAILED")
        print("\nAddress issues above and re-run this validator")
        return 1

if __name__ == '__main__':
    sys.exit(main())
