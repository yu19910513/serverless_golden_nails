export default function handler(req, res) {
  console.log("API hit!", req.url)
  res.status(200).json({ message: 'Hello from API' })
}
