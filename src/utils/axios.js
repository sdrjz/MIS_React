// src/utils/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5160',
  //baseURL: 'http://localhost/MIS_API',
//baseURL: 'http://172.25.0.34/MIS_API',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;