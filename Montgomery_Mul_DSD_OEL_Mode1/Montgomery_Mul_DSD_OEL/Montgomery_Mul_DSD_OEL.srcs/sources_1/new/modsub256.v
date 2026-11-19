`timescale 1ns / 1ps
//======================================================================
// modsub256.v  (OPT-1)
// Shared "conditional subtract" unit:  result = (x >= m) ? x - m : x
//                                      lt     = (x <  m)
// Works on SLICE_W bits per clock cycle (low slice first); the borrow is
// kept in a register between slices.  The final borrow is the compare.
//
// Usage: keep x and m stable while the unit works.
//   start : level, accepted when the unit is idle
//   chain : if 1 in the 'done' cycle, the next operation starts at once
//           (x may change at that clock edge)
//   done  : high for 1 cycle; result and lt are valid in that cycle
// Cycles: 1 (idle -> run) + NS (slices) + 1 (done) ; chained: NS + 1
//======================================================================
module modsub256 #(
    parameter N       = 256,
    parameter SLICE_W = 128          // N must be a multiple of SLICE_W
)(
    input  wire         clk,
    input  wire         reset_n,
    input  wire         start,
    input  wire         chain,
    input  wire [N-1:0] x,
    input  wire [N-1:0] m,
    output wire         done,
    output wire         lt,
    output wire [N-1:0] result
);
    localparam NS = N / SLICE_W;
    localparam IW = (NS > 1) ? $clog2(NS) : 1;

    localparam ST_IDLE = 2'd0, ST_RUN = 2'd1, ST_FIN = 2'd2;
    reg [1:0]    st;
    reg [IW-1:0] idx;
    reg          borrow;
    reg [N-1:0]  d;                  // x - m, built slice by slice

    wire [SLICE_W-1:0] xs = x[idx*SLICE_W +: SLICE_W];
    wire [SLICE_W-1:0] ms = m[idx*SLICE_W +: SLICE_W];
    wire [SLICE_W:0]   diff = {1'b0, xs} - {1'b0, ms} - borrow;  // bit SLICE_W = borrow out

    always @(posedge clk or negedge reset_n) begin
        if (!reset_n) begin
            st <= ST_IDLE; idx <= {IW{1'b0}}; borrow <= 1'b0;
        end else begin
            case (st)
                ST_IDLE: if (start) st <= ST_RUN;
                ST_RUN: begin
                    d[idx*SLICE_W +: SLICE_W] <= diff[SLICE_W-1:0];
                    borrow <= diff[SLICE_W];
                    if (idx == NS-1) st <= ST_FIN;
                    else             idx <= idx + 1'b1;
                end
                ST_FIN: begin
                    idx    <= {IW{1'b0}};
                    borrow <= 1'b0;
                    st     <= chain ? ST_RUN : ST_IDLE;
                end
                default: st <= ST_IDLE;
            endcase
        end
    end

    assign done   = (st == ST_FIN);
    assign lt     = borrow;                 // valid in the done cycle
    assign result = borrow ? x : d;         // x < m -> keep x
endmodule