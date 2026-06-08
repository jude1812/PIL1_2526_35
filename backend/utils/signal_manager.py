#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, signal

def signal_manager(func, *args, **kwargs): 
    def function(sig, frame):
        func(sig, frame, *args, **kwargs)
        # os.kill(os.getpid(), 9)
        # os._exit(1)
        sys.exit(1)
        
    signal.signal(signal.SIGINT, function)
    signal.signal(signal.SIGTERM, function)
    signal.signal(signal.SIGQUIT, function)
