// Copyright 1986-2018 Xilinx, Inc. All Rights Reserved.
// --------------------------------------------------------------------------------
// Tool Version: Vivado v.2018.2 (win64) Build 2258646 Thu Jun 14 20:03:12 MDT 2018
// Date        : Wed Nov 11 07:11:21 2026
// Host        : KHADIJA running 64-bit major release  (build 9200)
// Command     : write_verilog -force -mode synth_stub
//               d:/Vivado_Projects/Montgomery_Mul_DSD_OEL/Montgomery_Mul_DSD_OEL.srcs/sources_1/ip/vio_0/vio_0_stub.v
// Design      : vio_0
// Purpose     : Stub declaration of top-level module interface
// Device      : xc7a100tcsg324-1
// --------------------------------------------------------------------------------

// This empty module with port declaration file causes synthesis tools to infer a black box for IP.
// The synthesis directives are for Synopsys Synplify support to prevent IO buffer insertion.
// Please paste the declaration into a Verilog source file or add the file as an additional source.
(* X_CORE_INFO = "vio,Vivado 2018.2" *)
module vio_0(clk, probe_in0, probe_in1, probe_in2, probe_in3, 
  probe_out0, probe_out1, probe_out2, probe_out3)
/* synthesis syn_black_box black_box_pad_pin="clk,probe_in0[255:0],probe_in1[0:0],probe_in2[0:0],probe_in3[0:0],probe_out0[0:0],probe_out1[255:0],probe_out2[255:0],probe_out3[255:0]" */;
  input clk;
  input [255:0]probe_in0;
  input [0:0]probe_in1;
  input [0:0]probe_in2;
  input [0:0]probe_in3;
  output [0:0]probe_out0;
  output [255:0]probe_out1;
  output [255:0]probe_out2;
  output [255:0]probe_out3;
endmodule
