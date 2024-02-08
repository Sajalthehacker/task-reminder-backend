FROM node:18-alpine
WORKDIR /task-backend/

COPY Routes/ /task-backend/Routes
COPY Models/ /task-backend/Models
COPY Controllers/ /task-backend/Controllers
COPY Config/ /task-backend/Config

COPY index.js /task-backend/
COPY package.json /task-backend/

ENV MONGO_URL="mongodb+srv://sajalmangal:sajalmangal@cluster1.tb3duox.mongodb.net/"
ENV AUTH_EMAIL="sakshammittal2424@gmail.com"
ENV AUTH_PASSWORD="drzu hehc tvwl jgyv"
ENV JWT_SECRET="sajal"

EXPOSE 5000

RUN npm install
CMD ["npm", "start"]