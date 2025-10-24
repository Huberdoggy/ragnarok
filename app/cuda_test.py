# Sanity test - nvrun correctly offloads script to dGPU
import time

import torch

print("CUDA available: ", torch.cuda.is_available())
print("CUDA version: ", torch.version.cuda)
print("Device name: ", torch.cuda.get_device_name(0))

device = torch.device("cuda:0")
torch.cuda.init()  # force context creation

# allocate 32MB and do a brief compute
x = torch.randn((4096, 1024), device=device)
y = x @ x.t()
torch.cuda.synchronize()

print("Memory allocated (MB): ", torch.cuda.max_memory_allocated() / (1024 * 1024))

# keep the context and memory alive for a few seconds
time.sleep(8)
