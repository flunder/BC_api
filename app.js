const Express = require("express");
const BodyParser = require("body-parser");
const Mongoose = require("mongoose");

var app = Express();

Mongoose.connect("mongodb://localhost/myhorses", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

app.use(BodyParser.json())
app.use(BodyParser.urlencoded({ extended: true }))

const NameModel = Mongoose.model("name", {
    name: String,      // Dawg
    gender: String,    // "male"/"female"
    language: String,  // https://www.loc.gov/standards/iso639-2/php/code_list.php
    likes: Number      // 123
})

// to get around massive data collection,
// update the values by one and maybe reset it
// once in a while, then display on startup
// or periodically if there's been a change
// with stars dinging?
// Display one of the top 3 so it's not always
// the same, maybe check it's different to the
// last one?

// record doesn't exist -> Create with 1 count;
// record does    exist -> like ? +1 : -1;

const createNewName = async ({ name, gender, language, likes }) => {
    var newName = new NameModel({
        name: name.toLowerCase(),
        gender: gender.toLowerCase(),
        language: language.toLowerCase(),
        likes
    });
    var result = await newName.save();
    return result;
}

const updateName = async ({ name, type }) => {
    const newLikes = name.likes + ( type === "like" ? +1 : -1)
    name.set({ likes: newLikes });
    var result = await name.save()
    return result;
}

app.post("/name/:name", async(request, response, next) => {
    try {
        const { name } = request.params;
        const { gender, language, type } = request.body;

        // Find if it exists
        const exists = await NameModel.find({
            name: name.toLowerCase(),
            language: language.toLowerCase(),
            gender: gender.toLowerCase()
        }).exec();

        // Deal with it
        if (exists.length === 0) {
            // Create new name entry
            const result = await createNewName({ name, gender, language, likes: 1 })
            response.send(result)

        } else {
            // Update existing name entry
            const result = await updateName({ name: exists[0], type })
            response.send(result)

        }
    } catch (error) {
        response.status(500).send(error);
    }
})

app.get("/names", async(request, response, next) => {
    try {
        var result = await NameModel.find().exec();
        response.send(result)
    } catch (error) {
        response.status(500).send(error)
    }
})

app.delete("/name/:name", async(request, response, next) => {
    try {
        var result = await NameModel.deleteOne({ name: request.params.name }).exec();
        response.send(result);
    } catch (error) {
        response.status(500).send(error)
    }
})

app.post("/topnames", async(request, response, next) => {
    try {
        // const { gender, language, type } = request.body;
        var result = await NameModel.find(request.body)
                                    .sort({ likes: 'desc' })
                                    .limit(3)
                                    .exec();
        response.send(result)
    } catch (error) {
        response.status(500).send(error)
    }
})

app.listen(3000, () => {
    console.log("Listening at :3000...")
})
