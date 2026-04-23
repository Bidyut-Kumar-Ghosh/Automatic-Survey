import struct
import zlib
import os
import math

def create_rocket_icon(size, filename):
    """Create a professional rocket icon"""
    
    # Create RGB pixels array
    pixels = []
    
    # Colors
    bg_top = (102, 126, 234)      # Purple top
    bg_bottom = (118, 75, 162)    # Pink bottom
    rocket_body = (255, 255, 255)  # White rocket
    rocket_flame = (255, 107, 107) # Red flame
    rocket_tip = (255, 200, 87)    # Yellow tip
    
    center = size / 2
    
    for y in range(size):
        # Gradient background
        ratio = y / size
        bg_r = int(bg_top[0] * (1 - ratio) + bg_bottom[0] * ratio)
        bg_g = int(bg_top[1] * (1 - ratio) + bg_bottom[1] * ratio)
        bg_b = int(bg_top[2] * (1 - ratio) + bg_bottom[2] * ratio)
        
        for x in range(size):
            # Distance from center
            dx = x - center
            dy = y - center
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Determine pixel color
            r, g, b = bg_r, bg_g, bg_b
            
            # Draw rocket body (vertical oval)
            if abs(dx) < size * 0.15 and dy > -size * 0.3 and dy < size * 0.2:
                r, g, b = rocket_body
            
            # Draw rocket tip (triangle)
            if dy < -size * 0.25 and abs(dx) < (size * 0.15) * (1 + (dy + size * 0.3) / (size * 0.05)):
                if dy < -size * 0.25:
                    r, g, b = rocket_tip
            
            # Draw flame (below rocket)
            if abs(dx) < size * 0.12 and dy > size * 0.2 and dy < size * 0.4:
                r, g, b = rocket_flame
            
            # Draw secondary flame (sides)
            if dy > size * 0.15 and dy < size * 0.35:
                left_flame = abs(dx + size * 0.2) < size * 0.08 and dy > size * 0.15
                right_flame = abs(dx - size * 0.2) < size * 0.08 and dy > size * 0.15
                if left_flame or right_flame:
                    r, g, b = (255, 180, 80)
            
            # Draw window on rocket
            if abs(dx) < size * 0.08 and abs(dy + size * 0.05) < size * 0.08:
                r, g, b = (102, 126, 234)
            
            pixels.extend([r, g, b])
    
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    ihdr_chunk = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk (image data)
    raw_data = b''
    for y in range(size):
        raw_data += b'\x00'  # filter type
        for x in range(size):
            idx = (y * size + x) * 3
            raw_data += bytes([pixels[idx], pixels[idx+1], pixels[idx+2]])
    
    compressed_data = zlib.compress(raw_data)
    idat_crc = zlib.crc32(b'IDAT' + compressed_data) & 0xffffffff
    idat_chunk = struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    # Write PNG file
    with open(filename, 'wb') as f:
        f.write(png_signature + ihdr_chunk + idat_chunk + iend_chunk)
    
    print(f"✅ Created {filename} ({size}x{size})")

# Create icons
work_dir = r"c:\Users\NITRO V16\Downloads\Form Bot"

for size in [16, 48, 128]:
    create_rocket_icon(size, os.path.join(work_dir, f"icon{size}.png"))

print("✅ All improved icons created successfully!")
