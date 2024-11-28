const mysql = require('mysql2');
const express = require('express');
const app = express();
const cors = require('cors');
const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password:  "",
    database: "bd_dnd",
    connectionLimit:5
});
conexion.connect((err)=>{
    if(err){
        console.error(err);
        return;
    }
    console.log("conectado");
})

conexion.connect((err)=>{
    if(err){
        console.error('Error conectando a la base de datos: ', err);
        return;
    }
    console.log('Conectado a mysql')
})
module.exports = conexion;
app.use(express.json());
app.use(cors());

app.post('/bd_dnd/personajes', (req, res) => {
    const { nombre, clase, especie, trasfondo, usuario } = req.body;
  
    if (!nombre || !clase || !especie || !trasfondo || !usuario) {
      return res.status(400).json({ message: 'Faltan datos' });
    }
    conexion.query('SELECT id_usuario FROM usuarios WHERE nombre = ?', [usuario], (err, results) => {
      if (err) {
        console.error('Error al verificar el usuario:', err);
        return res.status(500).json({ message: 'Error al verificar el usuario', error: err });
      }
  
      if (results.length === 0) {
        return res.status(400).json({ message: 'El usuario no existe' });
      }
  
      const id_usuario = results[0].id_usuario;  
      const query = 'INSERT INTO personajes (nombre, clase, especie, trasfondo, id_usuario) VALUES (?, ?, ?, ?, ?)';
      conexion.query(query, [nombre, clase, especie, trasfondo, id_usuario], (err, result) => {
        if (err) {
          console.error('Error al insertar el personaje:', err);
          return res.status(500).json({ message: 'Error al crear el personaje', error: err });
        }
  
        res.status(201).json({
          message: 'Personaje creado correctamente',
          id_personaje: result.insertId,  
          id_usuario: id_usuario,  
        });
      });
    });
  });
app.get('/bd_dnd/personajes', async (req, res) => {
    const query = `
        SELECT 
            p.id_personaje, 
            p.nombre AS personaje_nombre, 
            p.clase, 
            p.especie, 
            p.trasfondo, 
            u.id_usuario, 
            u.nombre AS usuario_nombre
        FROM personajes p
        JOIN usuarios u ON p.id_usuario = u.id_usuario
    `;

    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error en la consulta SQL:', err); 
            return res.status(500).json({ message: 'Error al obtener los personajes', error: err });
        }

        res.json(results); 
    });
});

app.post('/bd_dnd/usuarios',async(req,res)=>{
    const {nombre, contrasena} = req.body;
    console.log(nombre, contrasena);
    if(!nombre || !contrasena){
        return res.status(400).json({message:'Faltan Datos'});
    }
    try{
        const query = 'INSERT INTO usuarios (nombre,contrasena) VALUES (?,?)';
        conexion.query(query,[nombre, contrasena],(err,result)=>{
            if(err){
                return res.status(500).json({message:'Error al crear el Usuario', error: err});
            }
            console.log('Usuario Creado ',{id_usuario: result.insertId, nombre:nombre, contrasena});
            res.status(201).json({message:'Usuario creado'})
        });
    }
    catch(err){
        console.error('Error al crear el Usuario ', err);
        res.status(500).json({message:'Error al crear el Usuario'});
    }
});
app.get('/bd_dnd/usuario', (req, res) => {
    const { nombre, contrasena } = req.query;  
    if (!nombre || !contrasena) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    try {
        const query = 'SELECT id_usuario, nombre FROM usuarios WHERE nombre = ? AND contrasena = ?';
        
        conexion.query(query, [nombre, contrasena], (err, results) => {
            if (err) {
                console.error('Error al ejecutar la consulta: ', err);
                return res.status(500).json({ message: 'Error al obtener el usuario', error: err });
            }

            if (results.length > 0) {
                const usuario = results[0];  
                console.log('Usuario encontrado:', usuario);

                return res.status(200).json({ 
                    message: 'Bienvenido ' + usuario.nombre, 
                    id_usuario: usuario.id_usuario 
                });
            } else {
                return res.status(401).json({ message: 'Nombre de usuario o contraseña incorrectos' });
            }
        });
    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({ message: 'Error al procesar la solicitud de login' });
    }
});

app.listen(3000, ()=>{
    console.log('Servidor corriendo en puerto 3000');
})