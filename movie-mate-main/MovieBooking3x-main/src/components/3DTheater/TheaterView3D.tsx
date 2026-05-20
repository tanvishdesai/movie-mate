"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './TheaterView3D.css';

interface TheaterView3DProps {
  selectedSeats: {
    row: string;
    col: number;
    seat_id: string;
    price: number;
  }[];
  allSeats: {
    row: string;
    col: number;
    seat_id: string;
    price: number;
  }[][];
  notAvailableSeats: {
    row: string;
    col: number;
    seat_id: string;
    price: number;
  }[];
  defaultVisible?: boolean;
}

const TheaterView3D: React.FC<TheaterView3DProps> = ({
  selectedSeats,
  allSeats,
  notAvailableSeats,
  defaultVisible = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current || !isVisible) return;

    // Debug logging
    console.log("TheaterView3D rendering with data:", {
      selectedSeats: selectedSeats.length,
      allSeats: allSeats.length,
      notAvailableSeats: notAvailableSeats.length
    });
    
    // Error handling for THREE.js
    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x171723);

      // Camera setup
      const width = mountRef.current.clientWidth || 800;
      const height = mountRef.current.clientHeight || 480;
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 40, 50);
      camera.lookAt(0, 0, 0);

      // Renderer setup with antialiasing for smoother edges
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Clear any existing canvas before appending
      if (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
      
      mountRef.current.appendChild(renderer.domElement);

      // Advanced lighting for better visual quality
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      // Main overhead light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
      directionalLight.position.set(0, 50, 0);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 100;
      directionalLight.shadow.radius = 2;
      scene.add(directionalLight);

      // Colored accent lights to enhance atmosphere
      const frontRedLight = new THREE.SpotLight(0xf84464, 1.5);
      frontRedLight.position.set(0, 15, -25);
      frontRedLight.angle = Math.PI / 3;
      frontRedLight.penumbra = 0.5;
      frontRedLight.castShadow = true;
      frontRedLight.shadow.mapSize.width = 1024;
      frontRedLight.shadow.mapSize.height = 1024;
      scene.add(frontRedLight);

      // Side lights for dimension
      const leftLight = new THREE.SpotLight(0x6a11cb, 0.7);
      leftLight.position.set(-30, 20, 0);
      leftLight.angle = Math.PI / 4;
      leftLight.penumbra = 0.5;
      scene.add(leftLight);

      const rightLight = new THREE.SpotLight(0x6a11cb, 0.7);
      rightLight.position.set(30, 20, 0);
      rightLight.angle = Math.PI / 4;
      rightLight.penumbra = 0.5;
      scene.add(rightLight);

      // Create screen with glowing effect
      const screenGeometry = new THREE.PlaneGeometry(30, 15);
      
      // Create a canvas texture for the movie screen
      const screenCanvas = document.createElement('canvas');
      screenCanvas.width = 600;
      screenCanvas.height = 300;
      const screenCtx = screenCanvas.getContext('2d');
      
      if (screenCtx) {
        // Add gradient background
        const gradient = screenCtx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#e0e0e0');
        screenCtx.fillStyle = gradient;
        screenCtx.fillRect(0, 0, 600, 300);
        
        // Add text
        screenCtx.fillStyle = '#333333';
        screenCtx.font = 'bold 40px Arial';
        screenCtx.textAlign = 'center';
        screenCtx.textBaseline = 'middle';
        screenCtx.fillText('SCREEN', 300, 150);
      }
      
      const screenTexture = new THREE.CanvasTexture(screenCanvas);
      const screenMaterial = new THREE.MeshStandardMaterial({ 
        map: screenTexture,
        emissive: 0xffffff,
        emissiveIntensity: 0.2,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.3
      });
      
      const screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(0, 9, -20);
      screen.receiveShadow = true;
      screen.castShadow = true;
      scene.add(screen);

      // Add a frame around the screen
      const frameGeometry = new THREE.BoxGeometry(32, 17, 1);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(0, 9, -20.5);
      frame.receiveShadow = true;
      scene.add(frame);

      // Screen glow effect using a point light
      const screenLight = new THREE.PointLight(0xf84464, 2, 30);
      screenLight.position.set(0, 9, -15);
      scene.add(screenLight);

      // Floor with texture
      const floorSize = 100;
      const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
      
      // Create a carpet-like texture for the floor
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = 512;
      floorCanvas.height = 512;
      const floorCtx = floorCanvas.getContext('2d');
      
      if (floorCtx) {
        // Dark base color
        floorCtx.fillStyle = '#1a1a24';
        floorCtx.fillRect(0, 0, 512, 512);
        
        // Add subtle pattern
        floorCtx.fillStyle = 'rgba(40, 40, 60, 0.6)';
        
        // Create a pattern of small dots
        for (let x = 0; x < 512; x += 8) {
          for (let y = 0; y < 512; y += 8) {
            if ((x + y) % 16 === 0) {
              floorCtx.beginPath();
              floorCtx.arc(x, y, 1, 0, Math.PI * 2);
              floorCtx.fill();
            }
          }
        }
      }
      
      const floorTexture = new THREE.CanvasTexture(floorCanvas);
      floorTexture.wrapS = THREE.RepeatWrapping;
      floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.repeat.set(4, 4);
      
      const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = Math.PI / 2;
      floor.position.y = -1.5;
      floor.receiveShadow = true;
      scene.add(floor);

      // Theater side walls with texture
      const wallCanvas = document.createElement('canvas');
      wallCanvas.width = 512;
      wallCanvas.height = 512;
      const wallCtx = wallCanvas.getContext('2d');
      
      if (wallCtx) {
        // Dark base color
        wallCtx.fillStyle = '#242333';
        wallCtx.fillRect(0, 0, 512, 512);
        
        // Add vertical stripes for acoustic panels
        wallCtx.fillStyle = 'rgba(50, 50, 70, 0.7)';
        for (let x = 0; x < 512; x += 64) {
          wallCtx.fillRect(x, 0, 32, 512);
        }
      }
      
      const wallTexture = new THREE.CanvasTexture(wallCanvas);
      wallTexture.wrapS = THREE.RepeatWrapping;
      wallTexture.wrapT = THREE.RepeatWrapping;
      wallTexture.repeat.set(2, 1);
      
      const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.7,
        metalness: 0.1
      });
      
      // Left wall
      const leftWallGeometry = new THREE.BoxGeometry(1, 20, 80);
      const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
      leftWall.position.set(-40, 8, 0);
      leftWall.receiveShadow = true;
      scene.add(leftWall);
      
      // Right wall
      const rightWallGeometry = new THREE.BoxGeometry(1, 20, 80);
      const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
      rightWall.position.set(40, 8, 0);
      rightWall.receiveShadow = true;
      scene.add(rightWall);
      
      // Create a helper function for mapping theater rows to 3D space
      const rowMap: {[key: string]: number} = {};
      const alphabetRows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < alphabetRows.length; i++) {
        rowMap[alphabetRows[i]] = i;
      }

      // Create realistic theater seats with seat numbers
      const createTheaterSeat = (rowIndex: number, colIndex: number, status: string, seatId: string, rowName: string) => {
        // Create seat group
        const seatGroup = new THREE.Group();
        
        // Different seat models based on price tier (row position)
        let seatWidth, seatHeight, seatDepth;
        
        // Premium seats (first few rows)
        if (rowIndex < 3) {
          seatWidth = 1.1;
          seatHeight = 1.0;
          seatDepth = 1.1;
        } else {
          // Standard seats
          seatWidth = 1.0;
          seatHeight = 0.9;
          seatDepth = 1.0;
        }
        
        // Seat base geometry
        const seatBaseGeometry = new THREE.BoxGeometry(seatWidth, seatHeight * 0.5, seatDepth);
        
        // Seat back geometry (slightly curved)
        const seatBackGeometry = new THREE.BoxGeometry(seatWidth, seatHeight * 0.8, seatDepth * 0.2);
        
        // Set colors based on seat status
        let seatColor;
        switch (status) {
          case 'selected':
            seatColor = 0x12b886; // Success color
            break;
          case 'occupied':
            seatColor = 0xfa5252; // Error color
            break;
          default:
            seatColor = 0x5555ff; // Available color
        }
        
        // Create materials with better properties
        const seatMaterial = new THREE.MeshStandardMaterial({ 
          color: seatColor,
          roughness: 0.4,
          metalness: 0.3
        });
        
        // Create seat parts
        const seatBase = new THREE.Mesh(seatBaseGeometry, seatMaterial);
        seatBase.castShadow = true;
        seatBase.receiveShadow = true;
        
        // Position the base at the bottom of the seat
        seatBase.position.y = seatHeight * 0.25;
        
        // Create and position seat back
        const seatBack = new THREE.Mesh(seatBackGeometry, seatMaterial);
        seatBack.castShadow = true;
        seatBack.receiveShadow = true;
        
        // Position the back at the rear of the seat and higher up
        seatBack.position.set(0, seatHeight * 0.65, -seatDepth * 0.4);
        
        // Add seat parts to group
        seatGroup.add(seatBase);
        seatGroup.add(seatBack);
        
        // Create a canvas for the seat number
        const seatLabelCanvas = document.createElement('canvas');
        seatLabelCanvas.width = 128;
        seatLabelCanvas.height = 128;
        const seatCtx = seatLabelCanvas.getContext('2d');
        
        if (seatCtx) {
          seatCtx.fillStyle = 'rgba(0, 0, 0, 0)';
          seatCtx.fillRect(0, 0, 128, 128);
          
          // Set font based on status
          seatCtx.font = 'bold 80px Arial';
          seatCtx.textAlign = 'center';
          seatCtx.textBaseline = 'middle';
          
          // White text
          seatCtx.fillStyle = '#ffffff';
          seatCtx.fillText(seatId, 64, 64);
        }
        
        // Create texture and material for seat number
        const seatLabelTexture = new THREE.CanvasTexture(seatLabelCanvas);
        const seatLabelMaterial = new THREE.MeshBasicMaterial({
          map: seatLabelTexture,
          transparent: true,
          side: THREE.DoubleSide
        });
        
        // Create a plane for the seat number
        const seatLabelGeometry = new THREE.PlaneGeometry(seatWidth * 0.8, seatWidth * 0.8);
        const seatLabel = new THREE.Mesh(seatLabelGeometry, seatLabelMaterial);
        
        // Position the label on top of the seat
        seatLabel.position.set(0, seatHeight * 0.5 + 0.01, 0);
        seatLabel.rotation.x = -Math.PI / 2; // Lay flat on top of seat
        
        seatGroup.add(seatLabel);
        
        // Position in curved theater layout
        const baseRadius = 15; // Starting radius for front row
        const rowSpacing = 2;
        const radius = baseRadius + rowIndex * rowSpacing;
        
        // Calculate total seats in row for proper spacing
        const totalSeatsInRow = 20; // Use this as a reference
        const seatSpread = Math.PI / 2.2; // Controls how wide seats spread
        
        // Adjusted column index to center the seats
        const adjustedColIndex = colIndex - (totalSeatsInRow / 2) + 0.5;
        const angle = (adjustedColIndex / totalSeatsInRow) * seatSpread;
        
        // Calculate position
        const xPos = Math.sin(angle) * radius;
        const zPos = Math.cos(angle) * radius;
        
        // Add stadium seating effect (increasing height for back rows)
        const yPos = rowIndex * 0.5; // Increased elevation for a more dramatic stadium effect
        
        seatGroup.position.set(xPos, yPos, zPos);
        
        // Rotate seat to face the screen
        seatGroup.rotation.y = Math.atan2(-xPos, -zPos);
        
        // Add the seat group to the scene
        scene.add(seatGroup);
        
        return seatGroup;
      };

      // Process seat data for 3D visualization
      const processSeatData = () => {
        try {
          // If no seat data is available, create placeholder visualization
          if (!allSeats || allSeats.length === 0) {
            console.warn("Creating default seat layout for demonstration");
            for (let row = 0; row < 8; row++) {
              for (let col = 0; col < 10; col++) {
                createTheaterSeat(row, col, Math.random() < 0.2 ? 'occupied' : 'available', String(col + 1), alphabetRows[row]);
              }
            }
            return;
          }

          // Flatten the allSeats structure and process all individual seats
          const allSeatData: {row: string, col: number, seat_id: string, status: string}[] = [];
          
          // Process each row of seats
          allSeats.forEach(row => {
            row.forEach(seat => {
              // Check seat status
              let status = 'available';
              
              // Check if not available
              const isUnavailable = notAvailableSeats.some(s => 
                s.row === seat.row && 
                s.col === seat.col && 
                s.seat_id === seat.seat_id
              );
              
              if (isUnavailable) {
                status = 'occupied';
              }
              
              // Check if selected
              const isSelected = selectedSeats.some(s => 
                s.row === seat.row && 
                s.col === seat.col && 
                s.seat_id === seat.seat_id
              );
              
              if (isSelected) {
                status = 'selected';
              }
              
              allSeatData.push({
                row: seat.row,
                col: seat.col,
                seat_id: seat.seat_id,
                status
              });
            });
          });
          
          // Find all unique rows and sort them
          const uniqueRows = Array.from(new Set(allSeatData.map(seat => seat.row))).sort();
          
          // Create row mapping (alphabetical order)
          const rowMapping: {[key: string]: number} = {};
          uniqueRows.forEach((row, index) => {
            rowMapping[row] = index;
          });
          
          // Get all seat data for each row to determine number of columns
          const rowData: { [key: string]: { col: number, seat_id: string, status: string }[] } = {};
          
          // Group seats by row
          allSeatData.forEach(seat => {
            if (!rowData[seat.row]) {
              rowData[seat.row] = [];
            }
            rowData[seat.row].push({ col: seat.col, seat_id: seat.seat_id, status: seat.status });
          });
          
          // Create seats using row mapping and actual position within the row
          Object.keys(rowData).forEach(row => {
            const rowIndex = rowMapping[row];
            const seatsInRow = rowData[row];
            
            // Sort seats by column
            seatsInRow.sort((a, b) => a.col - b.col);
            
            // Create each seat with its index within the row for proper spacing
            seatsInRow.forEach((seat, colIndex) => {
              createTheaterSeat(rowIndex, colIndex, seat.status, seat.seat_id, row);
            });
          });
        } catch (err) {
          console.error("Error processing seat data:", err);
          setError("Failed to process seat data. Please try refreshing the page.");
        }
      };

      // Run the seat processing function
      processSeatData();

      // Camera animation settings
      const rotateSpeed = 0.0003; // Slower for smoother movement
      let rotationAngle = 0;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        // Calculate camera position based on the size of the theater
        rotationAngle += rotateSpeed;
        
        // Get a good camera distance based on theater size
        const cameraDistance = 60;
        const cameraHeight = 35;
        
        // Calculate position with a smoother, more dramatic viewing angle
        const cameraX = Math.sin(rotationAngle) * cameraDistance;
        const cameraZ = Math.cos(rotationAngle) * cameraDistance;
        
        // Add gentle up/down motion
        const cameraY = cameraHeight + Math.sin(rotationAngle * 0.5) * 3;
        
        // Update camera position and look at center of theater
        camera.position.set(cameraX, cameraY, cameraZ);
        
        // Look at the middle of the theater, slightly toward the screen
        camera.lookAt(0, 0, -5);
        
        renderer.render(scene, camera);
      };
      animate();

      // Handle window resize
      const handleResize = () => {
        if (!mountRef.current) return;
        
        const newWidth = mountRef.current.clientWidth;
        const newHeight = mountRef.current.clientHeight;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };
      
      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
        
        // Clean up Three.js resources
        renderer.dispose();
        scene.clear();
      };
    } catch (err) {
      console.error("Error initializing 3D theater:", err);
      setError("Failed to initialize 3D theater. Your browser may not support WebGL or 3D graphics.");
    }
  }, [isVisible, allSeats, selectedSeats, notAvailableSeats]);

  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="theater-view-container">
      {error ? (
        <div className="theater-error">
          {error}
        </div>
      ) : (
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
};

export default TheaterView3D; 