#!/usr/bin/env python3

import base64
#from gevent.pywsgi import WSGIServer
import io
import os
import signal
import sys
import shutil
from threading import Thread


def get_parent_dir(n=1):
    """ returns the n-th parent dicrectory of the current
    working directory """
    current_path = os.path.dirname(os.path.abspath(__file__))
    for k in range(n):
        current_path = os.path.dirname(current_path)
    return current_path


def sig_handler(signum, frame):
    print("Serve caught signal:", signum)
    print("Exiting...")
    os._exit(0)


def run_video_thread(srcpath, camera_mode):
    try:
        if not camera_mode or camera_mode == "picamera":
            print("Running ServeVideoPiCamera...")
            import ServeVideoPiCamera
    except:
        print("Caught camera exception from ServeVideoPiCamera.")
    finally:
        if not camera_mode or camera_mode == "opencv":
            print("Running ServeVideo...")
            import ServeVideo
            ServeVideo.main()


def run_video(camera_mode):
    dirpath = os.path.dirname(os.path.realpath(__file__))
    srcpath = dirpath + "/ServeVideo.py"
    video_thread = Thread(target = run_video_thread, args = (srcpath, camera_mode))
    video_thread.start()


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, sig_handler)
    signal.signal(signal.SIGINT, sig_handler)
    run_video(os.getenv("CAMERA_MODE", ""))
