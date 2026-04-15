import express from 'express';

const app = express();

app.use(express.json());
app.get('/haelth', (req, res) => {
    res.status(200).json({ 
        status: 'success',
        message: 'Server is healthy' });
})

export default app;