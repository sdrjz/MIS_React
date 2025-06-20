// src/utils/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5160',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;