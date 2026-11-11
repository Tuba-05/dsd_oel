# Viva & Presentation Cheat-Sheet — 256-Bit Montgomery Modular Multiplier

This guide contains the complete viva explanations, 30-second presentation pitch, and Q&A removed from the dashboard UI so you can keep it open separately during your DSD Open-Ended Lab demonstration.

---

## 30-Second Presentation Pitch

> "In hardware, dividing 256-bit numbers by a modulus **M** is very slow and takes huge FPGA chip area. Instead of using a 256-bit divider circuit, our hardware converts the numbers into the **Montgomery Domain**. First, we generate a conversion key **$R^2 \bmod M$** using 512 simple doubling steps. Then we run our Core Engine (`montprod`) **4 times**. Inside the Core, division by $M$ is completely replaced by simple **32-bit additions (`adder32`)** and **1-bit right shifts (`shr32`, divide by 2)**!"

---

## Top Viva Questions & Answers

### 1. Why use Montgomery Multiplication instead of normal `(A * B) % M`?
* **Technical Answer:** Normal modulo division requires a 256-bit hardware divider circuit, which consumes massive FPGA LUT/slice area and creates a very slow critical path (low clock frequency). Montgomery multiplication replaces division by $M$ with simple **additions and 1-bit right shifts (division by 2)**.
* **In Simple Words:** Dividing by an arbitrary 256-bit number $M$ in binary is very hard, but dividing by $2$ in binary is effortless — you just shift the bits right by 1 position (`S >> 1`)!
* **Roman Urdu:** 256-bit division hardware bohot barha aur slow hota hai. Montgomery division ko right shifts (divide by 2) aur simple additions mein badal deta hai.

---

### 2. Why does `modmul_top.v` execute 4 Rounds (Passes)?
Because the `montprod` Core Engine always computes $\text{MontProd}(X, Y) = (X \cdot Y \cdot R^{-1}) \bmod M$ (where $R = 2^{256}$), we run 4 sequential passes to enter the Montgomery domain, multiply, and exit back to normal numbers:

1. **Round 1 (Pass 0):** Converts $A$ into Montgomery form using the key $R^2$:
   $$A' = \text{MontProd}(A, R^2) = (A \cdot R^2 \cdot R^{-1}) \bmod M = (A \cdot R) \bmod M$$
2. **Round 2 (Pass 1):** Converts $B$ into Montgomery form using the key $R^2$:
   $$B' = \text{MontProd}(B, R^2) = (B \cdot R^2 \cdot R^{-1}) \bmod M = (B \cdot R) \bmod M$$
3. **Round 3 (Pass 2):** Multiplies $A'$ and $B'$ together in the Montgomery domain:
   $$P' = \text{MontProd}(A', B') = (A \cdot R \cdot B \cdot R \cdot R^{-1}) \bmod M = (A \cdot B \cdot R) \bmod M$$
4. **Round 4 (Pass 3):** Multiplies $P'$ with $1$ to cancel out the remaining $R$ factor:
   $$P = \text{MontProd}(P', 1) = (A \cdot B \cdot R \cdot 1 \cdot R^{-1}) \bmod M = (A \cdot B) \bmod M$$

---

### 3. How is the Conversion Key ($R^2 \bmod M$) calculated without division?
* **Technical Answer:** In state `S_R2`, register `x` starts at `1` and loops for **512 clock cycles** (since $R = 2^{256}$, $R^2 = (2^{256})^2 = 2^{512}$). In each cycle, `x` is doubled (`2x`, which is a 1-bit left shift) and if `2x >= M`, we subtract `M`:
  ```verilog
  x <= (2x >= M) ? (2x - M) : 2x;
  ```
* **In Simple Words:** After 512 doublings with conditional subtraction, `x` holds the exact remainder of $2^{512} \bmod M$ without using a single division operation!

---

### 4. Why does adding $M$ inside `montprod` guarantee we can divide by 2 with zero remainder?
* **Mathematical Trick:** In each of the 256 bit-iterations of `montprod`, the core computes:
  $$S = \frac{S + b_i \cdot A + q \cdot M}{2}$$
* Because Modulus **$M$ is required to be ODD** (`M[0] == 1`), if the sum $(S + b_i \cdot A)$ is **odd**, we set the parity helper bit $q = 1$ and add $M$. Since $\text{Odd} + \text{Odd} = \text{Even}$, adding $M$ makes the numerator guaranteed **even** (its least significant bit is `0`) without changing the result modulo $M$!
* Once the numerator is even, dividing by $2$ is an exact 1-bit right shift (`S >> 1`) with zero remainder.

---

### 5. What are the 4 building blocks inside `montprod.v`?
1. **`blockmem1r1w.v` (`s_mem`):** Synchronous dual-port RAM that stores the 256-bit running accumulator $S$ as **eight 32-bit words** (`W0` MSW down to `W7` LSW).
2. **`adder32.v` (`s_adder_sm`):** 32-bit carry-propagating adder that adds Modulus $M$ (`S + M`) word-by-word when $q = 1$ to make $S$ even.
3. **`adder32.v` (`s_adder_sa`):** 32-bit carry-propagating adder that adds Multiplicand $A$ (`S + A`) word-by-word when the current multiplier bit $b_i = 1$.
4. **`shr32.v` (`shifter`):** 32-bit right-shifter that shifts $S$ right by 1 bit (`S >> 1`), propagating the carry bit from the most significant word (`W0`) down to the least significant word (`W7`).

---

### 6. Why does the Input Validator check 3 conditions in `S_IDLE`?
1. **`M[0] == 1` ($M$ must be odd):** Montgomery reduction requires $\gcd(R, M) = 1$. Since $R = 2^{256}$ is a power of 2, $M$ must have no factor of 2 (i.e., $M$ must be odd).
2. **`M[255:254] == 2'b00` ($M < 2^{254}$):** Ensures that intermediate additions $(S + A + M)$ inside the 256-bit words never overflow the 8×32-bit word capacity of `s_mem`.
3. **`A < M` and `B < M`:** Ensures the inputs are already reduced in the residue ring $\mathbb{Z}_M$.

