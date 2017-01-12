var express = require("express")
var mongoose = require("mongoose")
var app = express()

app.use(express.static(__dirname+"/static"))
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'))

app.set("views", __dirname + "/views")
app.set("view engine", "ejs")

mongoose.connect("mongodb://localhost/crossword")
mongoose.Promise = global.Promise

var CrosswordSchema = new mongoose.Schema({
	name: String,
	grid: Array,
	clues: String,
})

mongoose.model("Crossword", CrosswordSchema)
var Crossword = mongoose.model("Crossword")

app.get("/", function(request, response){
	Crossword.find({}, {}, {sort: {"created_at": -1} }, function(err, data){
		if (err){
			console.log("index error", err)
		} else {
			response.render("index", {"all_puzzles": data})
		}
	})
})

var server = app.listen(8000, function(){
	console.log("listening on port 8000")
})

// var grid = []
// var crossword

// Crossword.findOne({}, {}, {sort: {"created_at": -1} }, function(err, data){
// 	if (data){
// 		grid = data.grid
// 		crossword = data
// 	} else {
// 		var rows = 15
// 		var cols = 15

// 		for (var i = 0; i < rows; i++) {
// 			grid.push(Array(cols).fill(""))
// 		}

// 		Crossword.create({"name": "Sample", "grid": grid}, function(err, new_grid){
// 			crossword = new_grid
// 		})

// 	}
// })


var io = require("socket.io").listen(server)

io.sockets.on("connection", function(socket){
	console.log("User connected")
	console.log(socket.id)
	// socket.emit("new_grid", crossword)

	socket.on("new_grid_request", function(data){
		console.log(data)
		console.log(data.crossword_id)
		Crossword.findOne({"_id": data.crossword_id}, function(err, record){
			if (record){
				// grid = record.grid
				crossword = record
				socket.emit("new_grid", crossword)
				socket.join(data.crossword_id)
			} else {
				console.log("maybe an error finding a grid", err)
			}
			// } else {
			// 	var rows = 15
			// 	var cols = 15

			// 	for (var i = 0; i < rows; i++) {
			// 		grid.push(Array(cols).fill(""))
			// 	}

			// 	Crossword.create({"name": "Sample", "grid": grid}, function(err, new_grid){
			// 		crossword = new_grid
			// 	})

			
		})

		
	})

	socket.on("grid_update", function(data){
		socket.broadcast.to(data.crossword_id).emit("grid_update", data.grid)
		// crossword.grid = data.grid
		Crossword.findOne({"_id": data.crossword_id}, function(err, record){
			if (err){
				console.log("error saving grid", err)
				// grid = record.grid
			} else {
				record.grid = data.grid
				console.log(record.grid)
				record.save(function(err,data){
					console.log("****************")
					console.log(data)
					console.log("****************")
					if(err){
						console.log("saving error")
						console.log(err)
					} else {
						console.log("saved?")
						console.log(record.grid)
					}
				})
			}
		})
	})

	socket.on("clues_update", function(data){
		crossword.clues = data.clues
		socket.broadcast.emit("clues_update", crossword.clues)
		crossword.save(function(err){
			if(err){
				console.log("saving error")
				console.log(err)
			} else {
				console.log("saved?")
			}
		})
	})
		
		// console.log(crossword._id)
		// Crossword.findOne({_id: crossword._id}, function(err, data){
		// 	console.log("Found one")
		// 	data.grid = grid
		// 	console.log(data.grid)
		// 	data.save(function(err){
		// 		if(err){
		// 			console.log("saving error")
		// 			console.log(err)
		// 		} else {
		// 			console.log("saved?")
		// 		}
		// 	})
		// })
		// Crossword.findOneAndUpdate({_id: crossword._id}, {grid: grid})
})

