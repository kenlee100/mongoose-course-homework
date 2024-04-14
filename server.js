const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const http = require("http");

const headers = require("./headers");
const handleError = require("./handleError");
const handleSuccess = require("./handleSuccess");
const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
); 

mongoose
  .connect(DB)
  .then(() => console.log("資料庫連接成功"))
  .catch((error) => {
    console.log("error", error);
  });

const Post = require("./models/post");

const requestListener = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  if (req.url == "/posts" && req.method == "GET") {
    const post = await Post.find();
    handleSuccess(res, post);
  } else if (req.url == "/posts" && req.method == "POST") {
    req.on("end", async () => {
      try {
        const { name, content, image, like, tags } = JSON.parse(body);
        if (content && name && tags.length) {
          const newPost = await Post.create({ name, content, image, like, tags });
          handleSuccess(res, newPost);
        } else {
          handleError(res);
        }
      } catch (error) {
        handleError(res, error);
      }
    });
  } else if (req.url === "/posts" && req.method == "DELETE") {
    await Post.deleteMany({});
    handleSuccess(res, null);
  } else if (req.url.startsWith("/posts/") && req.method == "DELETE") {
    const id = req.url.split("/").pop();
    await Post.findByIdAndDelete(id);
    handleSuccess(res, null);
  } else if (req.url.startsWith("/posts/") && req.method == "PATCH") {
    const post = await Post.find();
    const id = req.url.split("/").pop();
    const { name, content, tags, likes, image } = JSON.parse(body);
    if (id && (name || content || tags.length)) {
      await Post.findByIdAndUpdate(id, { name, content, tags, likes, image  });
      handleSuccess(res, post);
    } else {
      handleError(res);
    }
  } else if (req.method == "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    handleError(res);
  }
};
const server = http.createServer(requestListener);
server.listen(process.env.PORT);
