<template>
  <div>
    <h1>Books with ISBN > 1000</h1>
    <ul>
      <li v-for="book in books" :key="book.id">
        {{ book.name }} (ISBN: {{ book.isbn }})
        <button @click="enableEdit(book)">Edit</button>
        <button @click="removeBook(book.id)">Delete</button>
      </li>
    </ul>

    <div v-if="editingBook">
      <h2>Edit Book</h2>
      <div>
        <label>ISBN:</label>
        <input type="text" v-model="editIsbn" />
      </div>
      <div>
        <label>Name:</label>
        <input type="text" v-model="editName" />
      </div>
      <button @click="saveEdit">Save</button>
      <button @click="editingBook = null">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../firebase/init.js';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const books = ref([]);
const editingBook = ref(null);
const editIsbn = ref('');
const editName = ref('');

const fetchBooks = async () => {
  try {
    const q = query(collection(db, 'books'), where('isbn', '>', 1000), orderBy('isbn'), limit(10));
    const querySnapshot = await getDocs(q);
    const booksArray = [];
    querySnapshot.forEach((doc) => {
      booksArray.push({ id: doc.id, ...doc.data() });
    });
    books.value = booksArray;
  } catch (error) {
    console.error('Error fetching books: ', error);
  }
};

const enableEdit = (book) => {
  editingBook.value = book;
  editIsbn.value = book.isbn;
  editName.value = book.name;
};

const saveEdit = async () => {
  try {
    const bookRef = doc(db, 'books', editingBook.value.id);
    await updateDoc(bookRef, {
      isbn: Number(editIsbn.value),
      name: editName.value
    });
    editingBook.value = null;
    await fetchBooks();
  } catch (error) {
    console.error('Error updating book: ', error);
  }
};

const removeBook = async (id) => {
  try {
    await deleteDoc(doc(db, 'books', id));
    await fetchBooks();
  } catch (error) {
    console.error('Error deleting book: ', error);
  }
};

onMounted(() => {
  fetchBooks();
});
</script>
