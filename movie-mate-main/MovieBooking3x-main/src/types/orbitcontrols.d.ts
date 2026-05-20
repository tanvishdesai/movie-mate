// Type definitions for three/examples/jsm/controls/OrbitControls
declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(camera: Camera, domElement?: HTMLElement);
    
    enabled: boolean;
    target: THREE.Vector3;
    
    // How far you can zoom in and out
    minDistance: number;
    maxDistance: number;
    
    // How far you can orbit vertically, upper and lower limits.
    minPolarAngle: number;
    maxPolarAngle: number;
    
    // How far you can orbit horizontally, upper and lower limits.
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    
    enableDamping: boolean;
    dampingFactor: number;
    
    enableZoom: boolean;
    zoomSpeed: number;
    
    enableRotate: boolean;
    rotateSpeed: number;
    
    enablePan: boolean;
    panSpeed: number;
    
    update(): boolean;
    dispose(): void;
  }
} 