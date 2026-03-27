import numpy as np

# Constants
GRANT_A5 = 432.081216
CUBIC_ROOT_2 = 2**(1/3) # 1.25992104989
DODECAHEDRAL_D = np.sqrt(15 - 6*np.sqrt(5)) # 1.25840857236

# Derivation
# If Grant's tuning is based on the cubic structure (1.2599), and nature prefers Dodecahedral (1.2584),
# The shift factor is D / Cubic
shift_factor = DODECAHEDRAL_D / CUBIC_ROOT_2
dodecahedral_hz = GRANT_A5 * shift_factor

print(f"Grant's Cubic Lock (A5): {GRANT_A5:.6f} Hz")
print(f"Cubic Root of 2: {CUBIC_ROOT_2:.10f}")
print(f"Dodecahedral D: {DODECAHEDRAL_D:.10f}")
print(f"Shift Factor: {shift_factor:.10f}")
print(f"Dodecahedral Lock (f_D): {dodecahedral_hz:.6f} Hz")
