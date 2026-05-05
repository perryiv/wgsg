# WebGPU Scene Graph

This project is a
[Scene Graph](https://en.wikipedia.org/wiki/Scene_graph)
library for
[WebGPU](https://webgpu.org/).
As of now, there are a lot of unfinished, basic features and rough edges; it's not ready for others to use.

That said, for the curious, there is an
[online demo](https://perryiv.github.io/wgsg_demo/)
available.
When the viewer first loads there will be a simple, programatically created scene. Left mouse rotates, right mouse "pans" (translates in the plane of the screen), and the mouse wheel will "zoom" (translate along the global z-axis).

Drag-and-drop an
[STL](https://en.wikipedia.org/wiki/STL_(file_format))
file to load it.
There is no server involved when you do this. All processing happens in the JavaScript running in your browser.
