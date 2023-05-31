import express, { json } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const PORT = process.env.PORT ?? 3000
const app = express()
app.use(morgan('dev'))

app.use(
  cors({
    methods: ['GET'],
    origin: [`https://localhost:${PORT}`, 'https://chat.openai.com']
  })
)

app.use(json())

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`)
  next()
})

// Endpoints for the plugin
app.get('/openapi.yaml', async (req, res, next) => {
  try {
    const filePath = path.join(process.cwd(), 'openapi.yaml')
    const yamlData = await fs.readFile(filePath, 'utf-8')
    res.setHeader('Content-Type', 'text/yaml')
    res.send(yamlData)
  } catch (e) {
    console.error(e.message)
    res.status(500).send({ error: 'Unable to fetch openapi.yaml manifest' })
  }
})

app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.sendFile(path.join(process.cwd(), '.well-known/ai-plugin.json'))
})

app.get('/icon.png', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'icon.png'))
})

// Endpoints API
let TODOS = [
  { id: crypto.randomUUID(), title: 'ToDo #1' },
  { id: crypto.randomUUID(), title: 'ToDo #2' },
  { id: crypto.randomUUID(), title: 'ToDo #3' },
  { id: crypto.randomUUID(), title: 'ToDo #4' }
]

app.get('/', (req, res) => {
  res.json({
    title: 'ToDo API',
    version: '1.0.0',
    description:
      'Plugin to manage a ToDo list for ChatGPT. You can add, remove, edit and view items',
    author: 'Jordi Ayala'
  })
})

app.get('/todos', (req, res) => {
  res.json({ todos: TODOS })
})

app.get('/todos/:id', (req, res) => {
  const { id } = req.params
  const todo = TODOS.find((todo) => todo.id === id)
  return res.json(todo)
})

app.post('/todos', (req, res) => {
  const { title } = req.body
  const newTodo = { id: crypto.randomUUID(), title }

  TODOS.push(newTodo)

  res.json(newTodo)
})

app.put('/todos/:id', (req, res) => {
  const { id } = req.params
  const { title } = req.body

  let newTodo = null

  TODOS.forEach((todo, index) => {
    if (todo.id === id) {
      newTodo = { ...todo, title }
      TODOS[index] = newTodo
    }
  })

  return res.json(newTodo)
})

app.delete('/todos/:id', (req, res) => {
  const { id } = req.params

  TODOS = TODOS.filter((todo) => todo.id !== id)

  return res.json({ ok: true })
})

// Start the server
app.listen(PORT, () => {
  console.log('ChatGPT Plugin is listening on port', PORT)
})
