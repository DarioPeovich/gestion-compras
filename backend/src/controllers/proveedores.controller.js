import prisma from '../config/prisma.js'

export const getProveedores = async (req, res, next) => {
  try {
    const proveedores = await prisma.compras_proveedores.findMany({
      orderBy: { razon_social: 'asc' }
    })
    res.json({ ok: true, data: proveedores })
  } catch (error) {
    next(error)
  }
}

export const getProveedorById = async (req, res, next) => {
  try {
    const { id } = req.params
    const proveedor = await prisma.compras_proveedores.findUnique({
      where: { id: parseInt(id) }
    })
    if (!proveedor) {
      const err = new Error('Proveedor no encontrado')
      err.status = 404
      return next(err)
    }
    res.json({ ok: true, data: proveedor })
  } catch (error) {
    next(error)
  }
}

export const createProveedor = async (req, res, next) => {
  try {
    const proveedor = await prisma.compras_proveedores.create({
      data: req.body
    })
    res.status(201).json({ ok: true, data: proveedor })
  } catch (error) {
    next(error)
  }
}

export const updateProveedor = async (req, res, next) => {
  try {
    const { id } = req.params
    const proveedor = await prisma.compras_proveedores.update({
      where: { id: parseInt(id) },
      data: req.body
    })
    res.json({ ok: true, data: proveedor })
  } catch (error) {
    next(error)
  }
}