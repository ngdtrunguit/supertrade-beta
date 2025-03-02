#!/bin/bash


# Ensure script is run from project root
if [[ ! -f "docker-compose.yml" ]]; then
    print_warning "Please run this script from the project root directory!"
    exit 1
fi










# Move Docker files
print_status "Moving Docker configuration files..."
mv backend/src/Dockerfile backend/ 2>/dev/null
mv frontend/src/Dockerfile frontend/ 2>/dev/null

# Cleanup empty directories
print_status "Cleaning up empty directories..."
rm -rf src 2>/dev/null
rm -rf public 2>/dev/null
rm -rf static 2>/dev/null

# Create .gitignore if not exists
print_status "Creating .gitignore..."
cat > .gitignore << EOL
# Python
__pycache__/
*.py[cod]
*$py.class
backend/venv/
*.env

# Node
frontend/node_modules/
frontend/build/
frontend/.env

# IDE
.vscode/
.idea/

# Misc
.DS_Store
EOL

# Update docker-compose.yml
print_status "Updating docker-compose.yml..."
cat > docker-compose.yml << EOL
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres/crypto_bot
    depends_on:
      - postgres

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=crypto_bot
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOL

# Final cleanup
print_status "Removing __pycache__ directories..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null

print_status "Project restructure complete! 🎉"
print_warning "Remember to:"
print_warning "1. Verify import statements in your Python and TypeScript files"
print_warning "2. Install dependencies in backend and frontend"
print_warning "3. Review and adjust configurations as needed"