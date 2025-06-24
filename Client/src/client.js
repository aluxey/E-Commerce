import { getItems, getItem } from './api.js';

// Gestion des différentes pages

document.addEventListener('DOMContentLoaded', async () => {
  const listContainer = document.querySelector('#items-container');
  if (listContainer) {
    try {
      const items = await getItems();
      items.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-3';
        col.innerHTML = `
          <div class="card h-100">
            <img src="${item.picture}" class="card-img-top" alt="${item.name}">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${item.name}</h5>
              <p class="card-text">${item.description}</p>
              <a href="product.html?id=${item.id}" class="btn btn-outline-primary mt-auto">Voir</a>
            </div>
          </div>`;
        listContainer.appendChild(col);
      });
    } catch (e) {
      listContainer.innerHTML = '<p class="text-danger">Erreur de chargement</p>';
    }
  }

  const detailContainer = document.querySelector('#product-detail');
  if (detailContainer) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      try {
        const item = await getItem(id);
        detailContainer.querySelector('img').src = item.picture;
        detailContainer.querySelector('h1').textContent = item.name;
        detailContainer.querySelector('p.lead').textContent = item.description;
        detailContainer.querySelector('.h4').textContent = (item.price / 100).toFixed(2) + ' €';
      } catch (e) {
        detailContainer.innerHTML = '<p class="text-danger">Produit introuvable</p>';
      }
    }
  }

  const buttons = document.querySelectorAll('.add-to-cart');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Fonction panier non implémentée.');
    });
  });
});
