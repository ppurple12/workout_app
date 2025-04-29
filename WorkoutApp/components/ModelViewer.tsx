import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber'; // Import useFrame here
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import modelPath from '../assets/Body2.glb';
// Type guard for MeshStandardMaterial
const isMeshStandardMaterial = (material: THREE.Material): material is THREE.MeshStandardMaterial => {
  return material instanceof THREE.MeshStandardMaterial;
};

// Mapping of object names to muscle group names
const muscleGroupMap: { [key: string]: string } = {
  male_1: 'Man',
  male_2: 'Chest',
  male_3: 'Abs',
  male_4: 'Quads',
  male_5: 'Hamstrings',
  male_6: 'Calfs',
  male_7: 'Glutes',
  male_8: 'Lats',
  male_9: 'Traps',
  male_10: 'FrontDelts',
  male_11: 'RearDelts',
  male_12: 'Triceps',
  male_13: 'Biceps'
  // Add additional mappings as necessary
};

// Predefined order of muscle groups

const muscleGroupOrder = [
  'Chest',
  'Abs',
  'Quads',
  'Hamstrings',
  'Calfs',
  'Glutes',
  'Lats',
  'Traps',
  'FrontDelts',
  'RearDelts',
  'Triceps',
  'Biceps',
];


interface BoxProps {
  rotationY: number;  // rotationY prop for controlling the mesh's rotation
  onMuscleValuesChange: (values: number[]) => void;  // Function to update muscle values
}

const Box: React.FC<{ rotationY: number; onMuscleValuesChange: (values: number[]) => void }> = ({ rotationY, onMuscleValuesChange }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { scene } = useGLTF (modelPath);
  
  // State for handling drag and rotation
  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState<{ x: number; y: number } | null>(null);
 

  // State to track muscle click counts
  const [activeMuscles, setActiveMuscles] = useState<{ [key: string]: number }>({});

  // Initialize materials and set default colors
useEffect(() => {
  if (mesh.current) {
    mesh.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            if (isMeshStandardMaterial(material)) {
              // Set default color for muscle groups
              material.color.set(muscleGroupMap[child.name] === 'Man' ? '#d3d3d3' : '#a9a9a9'); // Light gray for 'Man', darker gray for others
            }
          });
        } else if (isMeshStandardMaterial(child.material)) {
          child.material.color.set(muscleGroupMap[child.name] === 'Man' ? '#d3d3d3' : '#a9a9a9'); // Light gray for 'Man', darker gray for others
        }
      }
    });
  }
}, [scene]);

const getColorForClicks = (clicks: number) => {
  const yellow = new THREE.Color(0xffcc00);
  const red = new THREE.Color(0xff0000);
  const darkGray = new THREE.Color('#a9a9a9'); // Darker gray for muscle groups
  const lightGray = new THREE.Color('#d3d3d3'); // Lighter gray for 'Man'

  if (clicks === 0) {
    return darkGray; // Dark gray when no clicks
  } else if (clicks >= 6) {
    return darkGray; // Reset to dark gray after 5 clicks for muscle groups
  } else {
    return yellow.lerp(red, (clicks - 1) / 4); // Interpolate from yellow to red for clicks 1-5
  }
};

const handleClick = (event: any) => {
  event.stopPropagation();

  if (!mesh.current) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(mesh.current.children, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object as THREE.Mesh;
    const muscleName = muscleGroupMap[clickedObject.name] || clickedObject.name;

    // Only increment click count for muscles that are not "Man"
    if (muscleName !== 'Man') {
      const newActiveMuscles = { ...activeMuscles };
      newActiveMuscles[muscleName] = (newActiveMuscles[muscleName] || 0) + 1; // Increment click count

      // Reset click count after six clicks
      if (newActiveMuscles[muscleName] >= 6) {
        newActiveMuscles[muscleName] = 0; // Reset click count to 0
      }

      setActiveMuscles(newActiveMuscles);

      // Update colors for the clicked muscle
      const clickCount = newActiveMuscles[muscleName];
      const clickedMaterial = clickedObject.material;

      if (Array.isArray(clickedMaterial)) {
        clickedMaterial.forEach((material) => {
          if (isMeshStandardMaterial(material)) {
            material.color.set(getColorForClicks(clickCount));
          }
        });
      } else if (isMeshStandardMaterial(clickedMaterial)) {
        clickedMaterial.color.set(getColorForClicks(clickCount));
      }

      // Call the onMuscleValuesChange to update muscle values in the predefined order
      const muscleValues = muscleGroupOrder.map((muscle) => newActiveMuscles[muscle] || 0);
      onMuscleValuesChange(muscleValues);
    }
  } else {
    console.log('No objects intersected'); // Debugging message
  }
};

  

  // Use the rotation state to update the mesh rotation
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y = rotationY;
    }

  });

  return (
    <primitive
      object={scene}
      ref={mesh}
      scale={0.25}
      position={[0.1, -2.25, 0]} // Move to the right (X = 1), down (Y = -2)
      rotation={[Math.PI / 20, Math.PI / 150, 0
      ]} // Tilt downwards (rotate around X axis)
    // Adjust rotation values as necessary
      onClick={handleClick}
      
    />
  );
};

export default Box;