import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "ThePostgreSql",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1; //used to keep track of the current user, default is 1 for Angela
//first step extract the users from the user Table
/*let users = [
  { id: 1, name: "Angela", color: "teal" },
  //{ id: 2, name: "Jack", color: "powderblue" },
];*/

app.get("/", async (req, res) => { //handles the localhost request from the browser
  let users = await extractUsers();
  const countries = await checkVisisted(currentUserId); //use currentUserId to get the countries for the current user
  //console.log(currentUserId); console.log(users); console.log(countries) ; 
  const currentUser = users.find(u => u.id == currentUserId);
  const userColor = currentUser?.color || "teal";
  
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: userColor,
  });
});

app.post("/add", async (req, res) => { //handles the add form request
  const input = req.body["country"];
  console.log(input);
  const recievedcurrentUserId = currentUserId; // Use the global variable to get the current user ID
  console.log(recievedcurrentUserId);
  try {
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()] //lower convert all upper case to lower case
    );
    console.log(result);
    const data = result.rows[0];
    console.log(data);
    const countryCode = data.country_code;
    try {
      await db.query("INSERT INTO collected_visited_countriesdb (user_id, country_code) VALUES ($1, $2)",
        [currentUserId, countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log("an error occured", err);
      res.status(500).send("An error occurred: check ur DB");
    }
  } catch (err) {
    console.log("an error occured", err);
    res.status(500).send("An error occurred: check ur DB");
  }
});

app.post("/user", async (req, res) => {
  try {
    const userTabClicked = req.body.user;
    console.log(userTabClicked);
      if(userTabClicked == "new"){
          try{
            res.redirect("/new"); //this ask for a get handler to handle the res.redirect
          }catch(err){
            console.log("an error occured", err);
            res.status(500).send("An error occurred");
          }
      }else{
        try {
          currentUserId = userTabClicked; // Set the global user ID
          res.redirect("/"); //back to homepage
          /*const user_no = userTabClicked;
          const ucd = await extractUser(user_no);// ucd = user clicked details
          console.log(ucd);
          const ecud = await db.query("SELECT * FROM collected_visited_countriesdb WHERE user_id = $1", [user_no]);//ecud = extracted clicked user details
          console.log(ecud.rows);
          const cecud = ecud.rows.map((c) => c.countryCode); //cecud = cleaned extracted clicked user details*/

        }catch(err) {
          console.log("an error occured", err);
          res.status(500).send("An error occurred");
        }
      }
  } catch (error) {
    console.log("an error occured", err);
    res.status(500).send("An error occurred");
  }
});

app.get("/new", async (req, res) => { // to handle a new user
  try {
    res.render("new.ejs");
  }catch (err) {
    console.log("an error occured", err);
    res.status(500).send("An error occurred");
  }
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.post("/newuser", async (req, res) => {
  try {
    const nun = req.body.name; //nun = new user name
    const nul = req.body.lname; //nun = new user lastname
    const nuc = req.body.color; //nuc = new user color;

    try{
      const result = await db.query("INSERT INTO users_table (name, lname, color) VALUES ($1, $2, $3)", [nun, nul, nuc]);
      console.log("success: ", result.rows);
      res.redirect("/"); //back to homepage
    }catch(err){
      console.log("an error occured", err);
      res.status(500).send("An error occurred");
    }

  }catch (err) {
    console.log("an error occured", err);
    res.status(500).send("An error occurred");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

async function extractUser(user_no) {
  try{
    const users = await db.query("SELECT * FROM users_table WHERE id = $1", [user_no]);
    //console.log(users.rows); to log the row output
    return users.rows;

  } catch(err){
    console.log("an error occured", err);
    res.status(500).send("An error occurred: That country might already be in your list!");
  }
}

async function extractUsers() {
  try{
    const users = await db.query("SELECT * FROM users_table")
    //console.log(users.rows); to log the row output
    return users.rows;

  } catch(err){
    console.log("an error occured", err);
    res.status(500).send("An error occurred: That country might already be in your list!");
  }
}

async function checkVisisted(currentUserId) {
  try {
      const result = await db.query("SELECT country_code FROM collected_visited_countriesdb WHERE user_id = $1", [currentUserId]);
     //console.log(result.rows);
      /*let countries = [];
      result.rows.forEach((country) => {countries.push(country.country_code);
      }); this is using the for each function*/
      const countries = result.rows.map(user => user.country_code); //using the .map function
      console.log(countries); //to check the output and i discoverd that it is producing a array to be returned
      return countries; // return the array generated by the foreach function
    
  } catch (err) {
    console.log("an error occured", err);
    res.status(500).send("An error occurred: That country might already be in your list!");
  }
}