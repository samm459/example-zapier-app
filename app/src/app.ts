import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi, { string } from "joi";
import Express, { Request, Response } from "express";

type Middleware = (req: Request, res: Response) => any;

dotenv.config();
const app = Express();
const client = new MongoClient("mongodb://localhost:27017", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const auth: Middleware = (_, res) => {
  res.send(process.env.APP_SECRET);
};

const getResources: Middleware = async (req, res) => {
  if (req.headers["x-app-secret"] !== process.env.APP_SECRET) return res.status(401).send("Unauthorized");
  const Resource = client.db("test").collection("resources");
  const resources = await Resource.find().toArray();
  return res.status(200).send(JSON.stringify(resources));
};

const createResource: Middleware = async (req, res) => {
  if (req.headers["x-app-secret"] !== process.env.APP_SECRET) return res.status(401).send("Unauthorized");

  const schema = joi.object({
    title: string().required(),
    body: string().required(),
  });

  try {
    await schema.validateAsync(req.body, { abortEarly: true });
  } catch (err) {
    return res.status(422).send(err.details[0].message);
  }

  const Resource = client.db("test").collection("resources");
  await Resource.insertOne(req.body);

  return res.end("Resource created");
};

app.use(Express.json());
app.get("/auth", auth);
app.get("/resources", getResources);
app.post("/resources", createResource);

(async () => {
  await client.connect();
  app.listen(8090, () => {
    console.log("Server running on http://localhost:8090");
  });
})();
