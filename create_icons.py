from PIL import Image, ImageDraw, ImageFont
import os

# Create directory for icons if needed
icon_dir = os.path.dirname(os.path.abspath(__file__))

# Define icon sizes
sizes = [16, 48, 128]

# Colors
gradient_start = (102, 126, 234)  # #667eea
gradient_end = (118, 75, 162)     # #764ba2

def create_icon(size):
    # Create image with gradient background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient (simple top-to-bottom)
    for y in range(size):
        ratio = y / size
        r = int(gradient_start[0] * (1 - ratio) + gradient_end[0] * ratio)
        g = int(gradient_start[1] * (1 - ratio) + gradient_end[1] * ratio)
        b = int(gradient_start[2] * (1 - ratio) + gradient_end[2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Draw rocket emoji or text at center
    if size >= 48:
        # For larger sizes, try to draw text
        try:
            # Try to use a default font
            font_size = max(int(size * 0.5), 1)
            font = ImageFont.load_default()
            text = "🚀"
            # Draw centered text
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (size - text_width) // 2
            y = (size - text_height) // 2
            draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
        except:
            # Fallback: draw a simple circle
            margin = max(2, int(size * 0.15))
            draw.ellipse(
                [(margin, margin), (size - margin, size - margin)],
                fill=(255, 255, 255, 200),
                outline=(255, 255, 255, 255),
                width=1
            )
    else:
        # For very small icons, just draw a colored dot
        margin = 1
        draw.ellipse(
            [(margin, margin), (size - margin, size - margin)],
            fill=(255, 255, 255, 200)
        )
    
    return img

# Create and save icons
for size in sizes:
    icon = create_icon(size)
    filepath = os.path.join(icon_dir, f"icon{size}.png")
    icon.save(filepath, 'PNG')
    print(f"✅ Created {filepath}")

print("\n✅ All icons created successfully!")
