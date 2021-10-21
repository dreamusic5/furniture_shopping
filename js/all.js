const productList = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect");
const cartList = document.querySelector(".shoppingCart-tableList");
let productData = [];
let cartData = [];

function init(){
    getProductList();
    getCartList();
};
init();

//取得產品API
function getProductList(){
    // axios.get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/products`)
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`)
    .then(function(response){
        productData = response.data.products;
        renderProductList();
    });
};

//產品資訊字串
function combineProductHTMLItem(item){
    return `<li class="productCard">
    <h4 class="productType">新品</h4>
    <img src="${item.images}" alt="">
    <a href="#" class="js-addCart" id="addCardBtn" data-id="${item.id}">加入購物車</a>
    <h3>${item.title}</h3>
    <del class="originPrice">NT$${toThousands(item.origin_price)}</del>
    <p class="nowPrice">NT$${toThousands(item.price)}</p>
    </li>`
}

//顯示產品清單
function renderProductList(){
    let str ="";
    productData.forEach(function(item){
        str += combineProductHTMLItem(item);
    });
    productList.innerHTML = str;
};

//產品下拉篩選
productSelect.addEventListener("change",function(e){
    const category = e.target.value;
    if (category == "全部"){
        renderProductList();
        return;
    }
    let str = "";
    productData.forEach(function(item){
       if (item.category == category){
        str += combineProductHTMLItem(item);
       };
    });
    productList.innerHTML = str;
});

//加入購物車按鈕監聽 //監聽都在外層
productList.addEventListener("click",function(e){
    //取消預設動作(#移到最上面)
    e.preventDefault();
    let addCartClass = e.target.getAttribute("class");
    if (addCartClass !== "js-addCart" ){
        alert("點錯地方啦!");
        return;
    }
    let productId = e.target.getAttribute("data-id");
    let numCheck = 1;//產品數量初始值
    cartData.forEach(function(item){
        if (item.product.id === productId){
            numCheck = item.quantity+=1;
        };
    });

    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`,{
        "data": {
            "productId": productId,
            "quantity": numCheck
          }
    }).then(function(response){
        alert("成功加入");
        getCartList();
    });
});

//取得購物車列表
function getCartList(){
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function(response){
        //總金額
        document.querySelector(".js-total").textContent = toThousands(response.data.finalTotal);
        //購物車資料
        cartData = response.data.carts;
        let str ="";
        cartData.forEach(function(item){
            str += `<tr>
                <td>
                    <div class="cardItem-title">
                        <img src="${item.product.images}" alt="">
                        <p>${item.product.title}</p>
                    </div>
                </td>
                <td>NT$${toThousands(item.product.price)}</td>
                <td>${item.quantity}</td>
                <td>NT$${toThousands(item.product.price * item.quantity)}</td>
                <td class="discardBtn">
                    <a href="#" class="material-icons" data-id="${item.id}">
                        clear
                    </a>
                </td>
            </tr>`
        });
        cartList.innerHTML = str;
    });
};

//刪除購物車單筆
cartList.addEventListener("click",function(e){
    e.preventDefault(); //取消默認行為
    const cartId = e.target.getAttribute("data-id");
    if (cartId == null){
        alert("你沒有點對地方捏> <")
        return;
    }
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cartId}`)
    .then(function(response){
        alert("刪除單筆購物車成功囉!!")
        getCartList();
    });
});

//刪除全部購物車
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click",function(e) {
    e.preventDefault();//取消默認行為
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function(response){
        alert("全部都刪光光囉囉囉~");
        getCartList();
    })
    .catch(function (response) {
        alert("購物車已清空，請勿重複點擊")
    })
})

//送出預訂資料按鈕
const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click",function (e) {
    e.preventDefault();//取消默認
    //驗證購物車有無資料
    if (cartData.length == 0){
        alert("購物車無資料");
        return;
    }
    const customerName = document.querySelector("#customerName").value;
    const customerPhone = document.querySelector("#customerPhone").value;
    const customerEmail = document.querySelector("#customerEmail").value;
    const customerAddress = document.querySelector("#customerAddress").value;
    const customerTradeWay = document.querySelector("#tradeWay").value;
    //填寫資料除錯
    if(customerName == "" || customerPhone == "" || customerEmail == "" || customerAddress == "" ){
        alert("請輸入完整資料");
        return;
    }

    //驗證email
    if(checkEmail(customerEmail) == false){
        alert("電子信箱格式有誤");
        return;
    };

    //訂單資訊API送出
    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`,{
        "data": {
            "user": {
              "name": customerName,
              "tel": customerPhone,
              "email": customerEmail,
              "address": customerAddress,
              "payment": customerTradeWay
            }
          }
    }).then(function (response) {
        alert("訂單建立成功");
        //清空填寫的資訊
        document.querySelector("#customerName").value = "";
        document.querySelector("#customerPhone").value = "";
        document.querySelector("#customerEmail").value = "";
        document.querySelector("#customerAddress").value = "";
        document.querySelector("#tradeWay").value = "ATM";
        getCartList();
    })
});

//Email驗證
const customerEmail = document.querySelector("#customerEmail");
customerEmail.addEventListener("blur",function(e){
    if(checkEmail(customerEmail.value) == false){
        document.querySelector(`[data-message=Email]`).textContent = "請填寫正確 Email格式";
        return;
    };
});

//util js(工具類js)
//數字千分位處理
function toThousands(n) {
    n += "";
    var arr = n.split(".");
    var re = /(\d{1,3})(?=(\d{3})+$)/g;
    return arr[0].replace(re, "$1,") + (arr.length == 2 ? "." + arr[1] : "");
} 
//EMAIL格式
function checkEmail(mail) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)){
        return true
    }
        return false;
}