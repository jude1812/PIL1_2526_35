#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
