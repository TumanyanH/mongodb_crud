const express = require('express')
const bodyParser = require('body-parser')
const db = require('./db')
const Joi = require('joi')

const collection = 'todo'

const app = express()

const schema = Joi.object().keys({
    todo : Joi.string().required()
})

app.use(bodyParser.json())
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})

app.use(express.json({
    type: ['application/json', 'text/plain']
}))
  
app.get('/getTodos', (req, res) => {
    db.getDB().collection(collection).find({}).toArray((err, documents) => {
        if(err)
            console.log(err)
        else {
            console.log(documents);
            res.json(documents)
        }
    })
})

app.put('/:id', (req, res, next) => {
    let todoID = req.params.id;
    let userData = req.body;

    Joi.validate(userData, schema, (err, result) => {
        if(err) {
            let error = new Error('Invalid value');
            error.status = 400;
            next(error);
        } else {
            db.getDB().collection(collection).findOneAndUpdate({ _id : db.getPrimaryKey(todoID) }, {$set : {todo : userData.todo}}, { returnOriginal : false }, (err, result) => {
                if(err){
                    let error = new Error('Unable to add to database');
                    error.status = 400;
                    next(error)
                } else {
                    res.json({result, msg : 'Updated successfully', error : null})
                }
            })
        }
    })    
})

app.post('/createTodo', (req, res, next) => {
    let data = req.body;
    Joi.validate(data, schema, (err, response) => {
        if(err){
            let error = new Error('Invalid value')
            error.status = 400;
            return next(error)
        } else {
            db.getDB().collection(collection).insertOne({ todo : data.todo }, (err, result) => {
                if(err){
                    let error = new Error('Unable to save to database')
                    error.status = 400;
                    return next(error)
                } else 
                    res.json({ result : result, documents : result.ops[0], msg : "Added successfully!", error : null })
            });
        }
    })
    
})

app.delete('/:id',  (req, res, next) => {
    db.getDB().collection(collection).findOneAndDelete({_id : db.getPrimaryKey(req.params.id)}, (err, result) => {
        if(err){
            console.log(err)
            let error = new Error('Unable to delete')
            error.status = 400
            next(error)
        }
        else 
            res.json({result : result, msg : 'Deleted successfully', error : null })
    })
})

app.use((err, req, res, next) => {
    err.status = 400;
    res.status(err.status).json({
        error : {
            message : err.message
        }
    })
})

db.connect((err) => {
    if(err) {
        console.log('unable to connect to database');
        process.exit(1);
    } else {
        app.listen(3000, () => {
            console.log('connected to database on port 3000')
        })
    }
})

