#!/usr/bin/env python3
"""健康检查脚本 - 替代 curl，用于 Docker healthcheck"""
import urllib.request
import sys

try:
    response = urllib.request.urlopen("http://localhost:3000/health", timeout=5)
    if response.status == 200:
        sys.exit(0)
    sys.exit(1)
except Exception:
    sys.exit(1)
