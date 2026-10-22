const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

// For cost control, cap the number of containers each function can scale to.
setGlobalOptions({maxInstances: 10});

exports.countBooks = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const booksCollection = admin.firestore().collection("books");
      const snapshot = await booksCollection.get();
      const count = snapshot.size;
      res.status(200).json({count});
    } catch (error) {
      console.error("Error counting books:", error.message);
      res.status(500).send("Error counting books");
    }
  });
});

exports.getAllBooks = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const snapshot = await admin.firestore().collection("books").get();
      const books = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
      res.status(200).json(books);
    } catch (error) {
      console.error("Error getting books:", error.message);
      res.status(500).send("Error getting books");
    }
  });
});

// Capitalise every text field of a newly added book. Firestore triggers must
// run in the same region as the database (australia-southeast2).
exports.capitalizeBook = onDocumentCreated(
    {document: "books/{bookId}", region: "australia-southeast2"},
    async (event) => {
      const snapshot = event.data;
      if (!snapshot) {
        return;
      }

      const updates = {};
      for (const [field, value] of Object.entries(snapshot.data())) {
        if (typeof value === "string" && value !== value.toUpperCase()) {
          updates[field] = value.toUpperCase();
        }
      }

      // Updating does not fire onDocumentCreated again, so there is no loop.
      if (Object.keys(updates).length > 0) {
        await snapshot.ref.update(updates);
      }
    },
);
