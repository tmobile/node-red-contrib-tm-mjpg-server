---
title: MJPEG Server 
---

To start the live video streaming service in the background, execute the following.  On a
Raspberry Pi with Pi Camera module installed, execute the following:

```
python ServeVideoPiCamera.py &
```

For other setups making use of opencv enabled cameras, execute the following:

```
python ServeVideo.py &
```

The current implementation saves the latest frame as a JPEG image in the
current directory for the model serve script above to pick and process
for object detection as part of the Node-RED UI dashboard flow.
