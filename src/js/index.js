// Global app controller
//forkify-api.herokuapp.com

import Search from './models/Search';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import {elements, renderLoader, clearLoader} from './views/base';

//Global state of the app
//Search object
//Current recipe
//Shopping list object
//Liked recipes
const state = {};


/*
////Search controller
*/

const controlSearch =async () => {
  // 1) Get query from view
  const query = searchView.getInput();
  console.log(query); //TODO

  if(query) {
    //2) new search object and add it to state
    state.search = new Search(query);

    // 3) Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    
    try {
    //4) search for recipes
    await state.search.getResults();

    //5) renderresult on UI
    clearLoader();
    searchView.renderResults(state.search.result);

    } catch(error) {
      alert('Something wrong with the search..');
      clearLoader();
    }
  
  }
};


elements.searchForm.addEventListener('submit', e=> {
  e.preventDefault();
  controlSearch();

  
});




elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if(btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});


/*
////Recipe controller
*/

const controlRecipe = async () => {
  const id = window.location.hash.replace('#', '');

  if(id)  {
    //Prepare Ui for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

   if(state.search) searchView.highlightSelected(id);
    // Create new recipe object
    state.recipe = new Recipe(id);

 

    try {
// get recipe data
await state.recipe.getRecipe();
state.recipe.parseIngredients();
// calculate servings and time
state.recipe.calcTime();
state.recipe.calcServings();
//render recipe

      clearLoader();
      recipeView.renderRecipe(
        state.recipe,
        state.likes.isLiked(id)
        );
    } catch(error) {
      console.log(error);
      alert('Error processing recipe');
    }
  }
};



['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//List controller

const controlList = () => {
  // Create a new list IF there in none yet
  if (!state.list) state.list = new List();

  // Add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
      const item = state.list.addItem(el.count, el.unit, el.ingredient);
      listView.renderItem(item);
  });
};



// Handle delete and update list item events

elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  // Handle the delete button
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
      // Delete from state
      state.list.deleteItem(id);

      // Delete from UI
      listView.deleteItem(id);
  } else if(e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value);
    state.list.updateCount(id,val);
  }
});


//testing

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  // User has NOT yet liked current recipe
  if (!state.likes.isLiked(currentID)) {
      // Add like to the state
      const newLike = state.likes.addLike(
          currentID,
          state.recipe.title,
          state.recipe.author,
          state.recipe.img
      );

      likesView.toggleLikeBtn(true);

      likesView.renderLike(newLike);
   

  } else {
    state.likes.deleteLike(currentID);

    likesView.toggleLikeBtn(false);

    likesView.deleteLike(currentID);

   
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};


window.addEventListener('load', ()=> {
  state.likes = new Likes();


  state.likes.readStorage();

  likesView.toggleLikeMenu(state.likes.getNumLikes());

  state.likes.likes.forEach(like => likesView.renderLike(like));
});

elements.recipe.addEventListener('click', e => {
  if(e.target.matches('.btn-decrease, .btn-decrease *')) {
    if(state.recipe.servings > 1) {
    state.recipe.updateServings('dec');
    recipeView.updateServingsIngredients(state.recipe);
  }
  }  else if(e.target.matches('.btn-increase, .btn-increase *')) {
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if(e.target.matches('.recipe__btn--add, recipe__btn *')) {

    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    // Like controller
    controlLike();
  }
});

