
let exchangeRates = {};

async function fetchRates(base = 'USD') {
  try {
    const response = await fetch('https://v6.exchangerate-api.com/v6/4c6d59ce5af45be8f877c813/latest/' + base);
    const data = await response.json();
    if (data.result !== 'success') throw new Error('API failed');
    exchangeRates = data.conversion_rates;
  } catch (error) {
    alert("Error fetching exchange rates.");
    console.error(error);
  }
}

async function convertCurrency() {
  const amount = parseFloat(document.getElementById('amount').value);
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;

  if (isNaN(amount)) {
    alert("Please enter a valid number.");
    return;
  }

  if (!exchangeRates[from] || !exchangeRates[to]) {
    await fetchRates(from);
  }

  const rate = exchangeRates[to];
  const converted = amount * rate;
  const display = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;

  document.getElementById('result').innerText = display;
  saveToHistory(display);
  loadChart(from, to);
}

function toggleDarkMode() {
  const body = document.getElementById('body');
  body.classList.toggle('dark');
  body.classList.toggle('bg-blue-50');
  body.classList.toggle('bg-gray-900');
  body.classList.toggle('text-white');
  body.classList.toggle('text-black');
}

function swapCurrencies() {
  const from = document.getElementById('fromCurrency');
  const to = document.getElementById('toCurrency');
  const temp = from.value;
  from.value = to.value;
  to.value = temp;
  convertCurrency();
}

function saveToHistory(entry) {
  let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];
  history.unshift(entry);
  if (history.length > 5) history = history.slice(0, 5);
  localStorage.setItem("conversionHistory", JSON.stringify(history));
  displayHistory();
}

function displayHistory() {
  const history = JSON.parse(localStorage.getItem("conversionHistory")) || [];
  const historyList = document.getElementById("history");
  historyList.innerHTML = "";
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  });
}

async function loadChart(from, to) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);

  const formatDate = (date) => date.toISOString().split('T')[0];
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const url = `https://api.exchangerate.host/timeseries?start_date=${startStr}&end_date=${endStr}&base=${from}&symbols=${to}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.success) return;

  const labels = Object.keys(data.rates).sort();
  const values = labels.map(date => data.rates[date][to]);

  const ctx = document.getElementById("rateChart").getContext("2d");

  if (window.rateChart) {
    window.rateChart.destroy();
  }

  window.rateChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `${from} to ${to}`,
        data: values,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

window.onload = async () => {
  await fetchRates('USD');
  displayHistory();
};
