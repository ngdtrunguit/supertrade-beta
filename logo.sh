#!/bin/bash

# Create logos directory
mkdir -p frontend/public

# Create favicon.ico (16x16 blank icon)
convert -size 16x16 xc:transparent frontend/public/favicon.ico

# Create logo192.png (192x192 placeholder)
convert -size 192x192 xc:#4A90E2 -fill white -draw "text 50,100 'Crypto Bot'" frontend/public/logo192.png

# Create logo512.png (512x512 placeholder)
convert -size 512x512 xc:#4A90E2 -fill white -draw "text 150,250 'Crypto Trading Bot'" frontend/public/logo512.png

echo "Logo files created successfully!"