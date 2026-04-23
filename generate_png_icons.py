import struct
import zlib
import os

def create_gradient_png(size, filename):
    """Create a simple PNG with gradient background"""
    
    # Gradient colors
    start_r, start_g, start_b = 102, 126, 234  # #667eea
    end_r, end_g, end_b = 118, 75, 162         # #764ba2
    
    # Create pixel data
    pixels = []
    for y in range(size):
        for x in range(size):
            ratio = y / size
            r = int(start_r * (1 - ratio) + end_r * ratio)
            g = int(start_g * (1 - ratio) + end_g * ratio)
            b = int(start_b * (1 - ratio) + end_b * ratio)
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

# Create icon directory
work_dir = r"c:\Users\NITRO V16\Downloads\Form Bot"

# Create icons
for size in [16, 48, 128]:
    create_gradient_png(size, os.path.join(work_dir, f"icon{size}.png"))

print("✅ All icons created successfully!")
