---
layout: post
title: Qwen3-0.6B Performance Benchmarks: Modal GPU vs MLX CPU
description: Comparing offline inference performance of Qwen3-0.6B on Modal (A10G GPU) and MLX (Apple Silicon M1 CPU)
date: 2025-12-28
author: Nathan Nguyen
categories: [SGLang, Benchmarks]
tags: [SGLang, Benchmark, GPU, CPU, MLX, Modal, Qwen3]
---

When working on distributed serving systems, one of the key questions is: **how do different hardware platforms compare for inference workloads?** To answer this, I recently ran a series of benchmarks comparing GPU acceleration (via Modal's cloud GPUs) against CPU inference using MLX on Apple Silicon.

The results were interesting, and I think they highlight some important trade-offs for developers choosing between cloud GPU services and local CPU inference.

## Results Summary

| Platform  | Hardware | Model                         | Throughput         | Total Tokens | Time      |
| --------- | -------- | ----------------------------- | ------------------ | ------------ | --------- |
| **Modal** | A10G GPU | Qwen/Qwen3-0.6B               | **3,037.56 tok/s** | 133,966      | 44.10s    |
| **MLX**   | M1 CPU   | mlx-community/Qwen3-0.6B-4bit | **137.98 tok/s**   | 140,435      | 1,017.77s |

The GPU setup achieved **~22x higher throughput** than the CPU setup, as expected. However, the MLX CPU implementation provides a cost-effective option for local development and testing.

## Modal GPU Benchmark

**Setup:**

```bash
uv pip install modal
modal token new
```

Optionally add your HuggingFace token to `tests/sysperf/modal/.env`:

```bash
HF_TOKEN=your_token_here
```

**Run:**

```bash
modal run tests/sysperf/modal/modal_app.py
```

The benchmark processes 256 sequences with random input/output lengths, achieving **3,037.56 tok/s** on an A10G GPU.

## MLX CPU Benchmark

**Setup:**

```bash
cd tests/sysperf/mlx
uv sync
```

**Run:**

```bash
uv run benchmark.py
```

The MLX benchmark uses a 4-bit quantized model (`mlx-community/Qwen3-0.6B-4bit`) and runs on Apple Silicon CPUs. It achieved **137.98 tok/s** on an M1 chip.

## Key Takeaways

- **GPU acceleration** (Modal) provides significantly higher throughput for production workloads
- **CPU inference** (MLX) offers a practical solution for local development without GPU access
- Both benchmarks use the same base model (Qwen3-0.6B) for fair comparison, with MLX using a 4-bit quantized version

## Conclusion

The **~22x performance difference** between GPU and CPU is significant, but both platforms serve different purposes. For production workloads requiring high throughput, Modal's GPU acceleration is clearly the way to go. However, for local development, prototyping, and cost-sensitive applications, MLX on Apple Silicon provides a surprisingly capable alternative.

The fact that we can run a 4-bit quantized model locally at 137 tok/s opens up interesting possibilities for on-device inference, especially for applications where latency is acceptable but cost and privacy are priorities.

For more details on the implementation, check out the [benchmark PR](https://github.com/sgl-project/sglang/pull/40).
