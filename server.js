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

  if (req.url === "/posts" && req.method === "GET") {
    const post = await Post.find();
    handleSuccess(res, post);
  } else if (req.url === "/posts" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const { name, content, image, likes, tags } = JSON.parse(body);
        if (content && name && tags.length) {
          const newPost = await Post.create(
            { 
              name: typeof name === 'string' ? name.trim() : "",  
              content: typeof content === 'string' ? content.trim() : "", 
              image: typeof image === 'string' ? image.trim() : "",
              likes,
              tags
            }
          );
          handleSuccess(res, newPost);
        } else {
          handleError(res);
        }
      } catch (error) {
        handleError(res, error);
      }
    });
  } else if (req.url === "/posts" && req.method === "DELETE") {
    await Post.deleteMany({});
    handleSuccess(res, []);
  } else if (req.url.startsWith("/posts/") && req.method === "DELETE") {
    try {
      const id = req.url.split("/").pop();
      const findId = await Post.findById(id)
      if(findId.id) {
        const deletePost = await Post.findByIdAndDelete(id, {},{
          new: true,
        })
        handleSuccess(res, deletePost);
      }
    } catch (error) {
      handleError(res, error);
    }
  } else if (req.url.startsWith("/posts/") && req.method === "PATCH") {
    try {
      const id = req.url.split("/").pop();
      const findId = await Post.findById(id)
      const { name, content, tags, likes, image } = JSON.parse(body);
      if (findId.id && name && content && tags.length) {
        const updatePost = await Post.findByIdAndUpdate(id, {
          name: typeof name === 'string' ? name.trim() : "",  
          content: typeof content === 'string' ? content.trim() : "", 
          image: typeof image === 'string' ? image.trim() : "",
          likes, 
          tags
        },
        {
          new: true,
        }
      );
        handleSuccess(res, updatePost);
      } else {
        handleError(res);
      }
    } catch (error) {
      handleError(res, error);
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    handleError(res, '此路由不存在');
  }
};
const server = http.createServer(requestListener);
server.listen(process.env.PORT);
