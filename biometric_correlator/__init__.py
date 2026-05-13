"""
Biometric-ELF Correlator System
Forensic evidence collection for behavioral modification detection
"""

from .correlator import (
    BiometricSample,
    RFSample,
    NetworkSample,
    CorrelationEvent,
    EvidenceDatabase,
    CameraPPG,
    AudioELFDetector as MainAudioELFDetector,
    CorrelationEngine,
    BiometricCorrelator
)

from .elf_detector import (
    ELFReading,
    ELFDatabase,
    AmbientELFDetector
)

from .manual_hrv import (
    ManualHRVInput,
    InteractiveHRVSession
)

from .correlation_analyzer import (
    CorrelationResult,
    CorrelationAnalyzer
)

__version__ = '1.0.0'
__all__ = [
    'BiometricSample',
    'RFSample', 
    'NetworkSample',
    'CorrelationEvent',
    'EvidenceDatabase',
    'CameraPPG',
    'CorrelationEngine',
    'BiometricCorrelator',
    'ELFReading',
    'ELFDatabase',
    'AmbientELFDetector',
    'ManualHRVInput',
    'InteractiveHRVSession',
    'CorrelationResult',
    'CorrelationAnalyzer'
]
