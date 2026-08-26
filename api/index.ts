import app from '../backend/src/app';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless execution error:', err);
    return res.status(200).json({ error: err?.message || 'Server error' });
  }
}
