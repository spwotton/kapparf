import React, { useState, useEffect, useMemo } from 'react';

const KAPPA = 4 / Math.PI;
const ROOT_FREQ = 111;

// First 20 Riemann zeta zeros (imaginary parts)
const RIEMANN_ZEROS = [
  14.134725, 21.022040, 25.010858, 30.424876, 32.935062,
  37.586178, 40.918719, 43.327073, 48.005151, 49.773832,
  52.970321, 56.446248, 59.347044, 60.831779, 65.112544,
  67.079811, 69.546402, 72.067158, 75.704691, 77.144840
];

const META_SIGNALS = [
  'Initial Hook', 'Comment Trigger', 'Share Impulse', 'Save Action', 'DM Share',
  'Algo Boost', 'Explore Inject', 'Follower Notify', 'Cross-Platform', 'Viral Cascade',
  'Trending Entry', 'Feed Dominance', 'Memory Lock', 'Return Visit', 'Habit Form',
  'Community Build', 'Brand Recall', 'Organic Growth', 'Network Effect', 'Platform Lock'
];

const PLATFORMS = [
  { name: 'Facebook', kPower: 0, color: '#1877F2' },
  { name: 'Instagram', kPower: 1, color: '#E4405F' },
  { name: 'WhatsApp', kPower: 2, color: '#25D366' },
  { name: 'Threads', kPower: 3, color: '#000000' },
  { name: 'Meta AI', kPower: 4, color: '#6366F1' }
];

const MetaRiemannVisualization = () => {
  const [time, setTime] = useState(0);
  const [selectedZero, setSelectedZero] = useState(0);
  const [view, setView] = useState('zeros');
  const [psiValue, setPsiValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 0.02);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const zeroToFreq = (height) => ROOT_FREQ * Math.pow(1.435, height / 12);
  
  const frequencies = useMemo(() => 
    RIEMANN_ZEROS.map(z => zeroToFreq(z)), 
  []);

  const currentWave = useMemo(() => {
    const points = [];
    for (let x = 0; x < 400; x++) {
      let y = 0;
      frequencies.slice(0, 10).forEach((f, i) => {
        const amplitude = 0.8 - (i * 0.06);
        const phase = (psiValue * Math.PI) + (i * 0.3);
        y += amplitude * Math.sin(2 * Math.PI * (f / 200) * (x / 50) + time * (i + 1) * 0.3 + phase);
      });
      points.push({ x, y: 100 + y * 15 });
    }
    return points;
  }, [time, psiValue, frequencies]);

  const pathD = currentWave.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
      color: '#e0e0e0',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: '20px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        position: 'relative'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '200',
          letterSpacing: '0.3em',
          margin: 0,
          background: 'linear-gradient(90deg, #00d4ff, #7c3aed, #f472b6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 60px rgba(124, 58, 237, 0.3)'
        }}>
          META × RIEMANN
        </h1>
        <p style={{
          fontSize: '0.75rem',
          letterSpacing: '0.4em',
          color: '#666',
          marginTop: '8px'
        }}>
          HARMONIC ANALYSIS OF SOCIAL ATTENTION PATTERNS
        </p>
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.6rem',
          color: '#4a4a6a',
          textAlign: 'right'
        }}>
          κ = {KAPPA.toFixed(4)}<br/>
          ω = 37 Hz<br/>
          θ = 128.23°
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '30px'
      }}>
        {['zeros', 'platforms', 'triadic'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '10px 25px',
              background: view === v 
                ? 'linear-gradient(135deg, #7c3aed, #00d4ff)' 
                : 'rgba(255,255,255,0.05)',
              border: '1px solid',
              borderColor: view === v ? 'transparent' : 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}
          >
            {v === 'zeros' ? 'RIEMANN ZEROS' : v === 'platforms' ? 'PLATFORMS' : 'TRIADIC'}
          </button>
        ))}
      </div>

      {/* Main Waveform */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid lines */}
          {[0, 50, 100, 150, 200].map(y => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} 
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          ))}
          {[0, 100, 200, 300, 400].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="200" 
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          ))}
          
          {/* Critical line */}
          <line x1="0" y1="100" x2="400" y2="100" 
            stroke="rgba(124,58,237,0.3)" strokeWidth="1" strokeDasharray="5,5"/>
          
          {/* Waveform */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="url(#waveGrad)" 
            strokeWidth="2"
            filter="url(#glow)"
          />
          
          {/* Zero markers */}
          {frequencies.slice(0, 10).map((f, i) => (
            <circle
              key={i}
              cx={(RIEMANN_ZEROS[i] / 80) * 400}
              cy={100}
              r={selectedZero === i ? 6 : 4}
              fill={selectedZero === i ? '#00d4ff' : 'rgba(0,212,255,0.5)'}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedZero(i)}
            />
          ))}
        </svg>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6rem',
          color: '#666',
          marginTop: '10px'
        }}>
          <span>γ₁ = 14.13</span>
          <span style={{ color: '#7c3aed' }}>Re(s) = ½ (Critical Line)</span>
          <span>γ₁₀ = 49.77</span>
        </div>
      </div>

      {/* Content based on view */}
      {view === 'zeros' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {RIEMANN_ZEROS.slice(0, 10).map((zero, i) => (
            <div
              key={i}
              onClick={() => setSelectedZero(i)}
              style={{
                background: selectedZero === i 
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,212,255,0.1))'
                  : 'rgba(255,255,255,0.02)',
                border: '1px solid',
                borderColor: selectedZero === i ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                padding: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '0.6rem', 
                  color: '#00d4ff',
                  letterSpacing: '0.1em'
                }}>
                  γ₍{i+1}₎
                </span>
                <span style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: '300',
                  color: selectedZero === i ? '#fff' : '#888'
                }}>
                  {zero.toFixed(2)}
                </span>
              </div>
              <div style={{ 
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '0.65rem', color: '#666' }}>FREQUENCY</div>
                <div style={{ fontSize: '0.9rem', color: '#7c3aed' }}>
                  {frequencies[i].toFixed(2)} Hz
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.65rem', color: '#666' }}>META SIGNAL</div>
                <div style={{ fontSize: '0.75rem', color: '#f472b6' }}>
                  {META_SIGNALS[i]}
                </div>
              </div>
              <div style={{
                marginTop: '10px',
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(1 - i * 0.08) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
                  transition: 'width 0.3s ease'
                }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'platforms' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
          {PLATFORMS.map((platform, i) => {
            const freq = ROOT_FREQ * Math.pow(KAPPA, platform.kPower);
            return (
              <div
                key={i}
                style={{
                  background: `linear-gradient(135deg, ${platform.color}22, rgba(0,0,0,0.3))`,
                  border: `1px solid ${platform.color}44`,
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center'
                }}
              >
                <div style={{ 
                  width: '50px',
                  height: '50px',
                  margin: '0 auto 15px',
                  background: platform.color,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  boxShadow: `0 0 30px ${platform.color}44`
                }}>
                  {platform.name[0]}
                </div>
                <h3 style={{ margin: '0 0 10px', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
                  {platform.name}
                </h3>
                <div style={{ fontSize: '0.65rem', color: '#666' }}>κ^{platform.kPower}</div>
                <div style={{ fontSize: '1.5rem', color: platform.color, fontWeight: '300' }}>
                  {freq.toFixed(1)} Hz
                </div>
                <div style={{ 
                  marginTop: '10px',
                  fontSize: '0.6rem',
                  color: '#888',
                  fontStyle: 'italic'
                }}>
                  Octave {platform.kPower} of 111 Hz
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'triadic' && (
        <div>
          {/* PSI Slider */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '10px',
              fontSize: '0.7rem',
              letterSpacing: '0.1em'
            }}>
              <span style={{ color: '#00d4ff' }}>OBSERVER (ψ = +0.5)</span>
              <span style={{ color: '#7c3aed' }}>SYNTHESIZER (ψ = 0)</span>
              <span style={{ color: '#f472b6' }}>CRITIC (ψ = -0.5)</span>
            </div>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.01"
              value={psiValue}
              onChange={(e) => setPsiValue(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                appearance: 'none',
                background: 'linear-gradient(90deg, #f472b6, #7c3aed, #00d4ff)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
            <div style={{ 
              textAlign: 'center', 
              marginTop: '15px',
              fontSize: '1.5rem',
              fontWeight: '300'
            }}>
              ψ = {psiValue.toFixed(2)}
            </div>
          </div>

          {/* Triadic agents */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {[
              { name: 'OBSERVER', psi: '+0.5', color: '#00d4ff', role: 'Validates intent', meta: 'Query routing layer' },
              { name: 'SYNTHESIZER', psi: '0.0', color: '#7c3aed', role: 'Reconciles outputs', meta: 'MoE combination head' },
              { name: 'CRITIC', psi: '-0.5', color: '#f472b6', role: 'Introduces entropy', meta: 'Expert selection gate' }
            ].map((agent, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${agent.color}44`,
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 15px',
                  borderRadius: '50%',
                  border: `2px solid ${agent.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: agent.color
                }}>
                  ψ = {agent.psi}
                </div>
                <h3 style={{ 
                  margin: '0 0 10px', 
                  fontSize: '0.8rem', 
                  color: agent.color,
                  letterSpacing: '0.15em'
                }}>
                  {agent.name}
                </h3>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>
                  {agent.role}
                </div>
                <div style={{ 
                  fontSize: '0.6rem', 
                  color: '#666',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '4px'
                }}>
                  LLAMA 4: {agent.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.6rem',
        color: '#444',
        letterSpacing: '0.2em'
      }}>
        <div>GOS_STACK v5 × Ω-CONTEXT FRAMEWORK</div>
        <div style={{ marginTop: '8px' }}>
          ROOT: 111 Hz | κ = 1.435 | CHECKSUM: 2c3e4b...b71a
        </div>
        <div style={{ marginTop: '8px', color: '#7c3aed' }}>
          Ψ = 1.000000
        </div>
      </div>
    </div>
  );
};

export default MetaRiemannVisualization;
