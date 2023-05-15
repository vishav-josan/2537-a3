const numPerPage = 10;
let activePage = 1;
let pokeList = [];
let pokeTypes = [];

// Create Pagination Buttons
const generatePagination = (activePage, totalPage) => {
  $('#pagination').empty();
  
  // Determine the range of visible pages
  const startPage = Math.max(1, activePage - 2);
  const endPage = Math.min(totalPage, startPage + 4);

  // Create Previous Button
  if (activePage > 1) {
    $('#pagination').append(`<button class="btn btn-primary page ml-1 prevPage" value="${activePage - 1}">Prev</button>`);
  }

  // Create Numbered Buttons
  for (let i = startPage; i <= endPage; i++) {
    $('#pagination').append(`<button class="btn btn-primary page ml-1 numPage ${i === activePage ? 'active' : ''}" value="${i}">${i}</button>`);
  }

  // Create Next Button
  if (activePage < totalPage) {
    $('#pagination').append(`<button class="btn btn-primary page ml-1 nextPage" value="${activePage + 1}">Next</button>`);
  }
};

// Display Pokemon Cards
const displayPokeCards = async (activePage, numPerPage, pokeList) => {
  const selectedPokeList = pokeList.slice((activePage - 1) * numPerPage, activePage * numPerPage);

  $('#pokeCards').empty();
  for (let pokeData of selectedPokeList) {
    const res = await axios.get(pokeData.url);
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}>
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>  
    `);
  }
};

// Filter Pokemon by Type
const filterPokeType = async (activePage, numPerPage, pokeList) => {
  const selectedTypes = $('input[name="typeFilter"]:checked').map((_, el) => el.value).get();
  $('#pokeCards').empty();
  
  if (selectedTypes.length === 0) {
    displayPokeCards(activePage, numPerPage, pokeList);
  } else {
    const filteredPokeList = await Promise.all(pokeList.map(async (pokeData) => {
      const res = await axios.get(pokeData.url);
      const pokeTypes = res.data.types.map(type => type.type.name);
      return {
        ...pokeData,
        types: pokeTypes
      };
    })).then(pokeList => pokeList.filter(pokeData => selectedTypes.every(type => pokeData.types.includes(type))));
    displayPokeCards(activePage, numPerPage, filteredPokeList);
    generatePagination(activePage, Math.ceil(filteredPokeList.length / numPerPage));
document.getElementById('totalPokemon').textContent = filteredPokeList.length;
  }
};

// Setup and Display Initial Data
const initialize = async () => {
  $('#pokeCards').empty();
  
  // Fetch all Pokemon
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokeList = response.data.results;
  const totalPokeCount = pokeList.length;
  document.getElementById('totalPokemon').textContent = totalPokeCount;
  
  // Display Pokemon Cards and Pagination
  displayPokeCards(activePage, numPerPage, pokeList);
  const totalPage = Math.ceil(pokeList.length / numPerPage);
  generatePagination(activePage, totalPage);
  
  // Fetch Pokemon Types
  const typeResponse = await axios.get('https://pokeapi.co/api/v2/type');
  pokeTypes = typeResponse.data.results.map(type => type.name);
  
  // Display Type Checkboxes
  const typeCheckboxes = pokeTypes.map(type => `
    <div class="form-check">
      <input class="form-check-input typeCheckbox" type="checkbox" name="typeFilter" value="${type}">
      <label class="form-check-label">
        ${type}
      </label>
    </div>
  `).join('');
  $('#typeFilter').html(`
    <h3>Pokemon Types:</h3>
    ${typeCheckboxes}
  `);
  
  // Add Event Listener for Type Checkboxes
  $('body').on('click', '.typeCheckbox', async function() {
    filterPokeType(activePage, numPerPage, pokeList);
  });

  // Add Event Listener for Pokemon Cards
  $('body').on('click', '.pokeCard', async function() {
    const pokeName = $(this).attr('pokeName');
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeName}`);
    const types = res.data.types.map((type) => type.type.name);
    $('.modal-body').html(`
      <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
          <h3>Abilities</h3>
          <ul>
            ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h3>Stats</h3>
          <ul>
            ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
          </ul>
        </div>
      </div>
      <h3>Types</h3>
      <ul>
        ${types.map((type) => `<li>${type}</li>`).join('')}
      </ul>
    `);
    $('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
    `);
  });

  // Add Event Listener for Pagination Buttons
  $('body').on('click', '.numPage, .prevPage, .nextPage', async function() {
    activePage = Number($(this).val());
    filterPokeType(activePage, numPerPage, pokeList);
    generatePagination(activePage, totalPage);
  });
};

// Initialize on Document Ready
$(document).ready(initialize);
