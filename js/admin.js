let orderData = [];
const orderList = document.querySelector(".js-orderList");

//預設初始化
function init(){
    getOrderList();
};
init();

//C3圓餅圖
function renderC3(){
    //確認orderData資料是否都撈回
    //console.log(orderData);
    //物件資料蒐集
    let total = {};
    orderData.forEach(function(item){
       item.products.forEach(function(productItem){
           if(total[productItem.category]==undefined){
            total[productItem.category] = productItem.price*productItem.quantity
           }else{
            total[productItem.category] += productItem.price*productItem.quantity
           }
       }) 
    })
    // console.log(total);
    // 做出資料關聯
    let category = Object.keys(total);
    // console.log(category);
    let newData = [];
    category.forEach(function(item){
        let ary = [];
        ary.push(item);
        ary.push(total[item]);
        newData.push(ary);
    })
    // console.log(newData);

    // C3.js
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: newData,
        },
    });
};

//C3圓餅圖_LV2
function renderC3_lv2(){
    //資料蒐集
    let obj = {};
    orderData.forEach(function (item) {
        item.products.forEach(function (productItem) {
        if (obj[productItem.title] === undefined) {
            obj[productItem.title] = productItem.quantity * productItem.price;
        } else {
            obj[productItem.title] += productItem.quantity * productItem.price;

            }   
        })
    });
    // console.log(obj);

    //拉出資料關聯
    let originAry = Object.keys(obj);
    // console.log(originAry);

    //透過 originAry,整理成 C3 格式
    let rankSortAry = [];
    originAry.forEach(function(item){
        let ary = [];
        ary.push(item);
        ary.push(obj[item]);
        rankSortAry.push(ary);
    });
    // console.log(rankSortAry);

    /// 比大小，降冪排列（目的：取營收前三高的品項當主要色塊，把其餘的品項加總起來當成一個色塊）
    // sort: https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    rankSortAry.sort(function(a,b){
        return b[1] - a[1];
    });

    //如果比數超過4筆以上，統整為其他
    if (rankSortAry.length > 3){
        let otherTotal = 0;
        rankSortAry.forEach(function(item,index){
            if(index > 2){
                otherTotal += rankSortAry[index][1];
            }
        })
        rankSortAry.splice(3, rankSortAry.length - 1);
        rankSortAry.push(['其他', otherTotal]);
    }

    //超過三筆後將第四名之後的價格加總起來放在otherTotal
    //C3 圖表
    c3.generate({
        bindto: '#chart',
        data: {
          columns: rankSortAry,
          type: 'pie',
        },
        color: {
          pattern: ["#301E5F", "#5434A7", "#9D7FEA", "#DACBFF"]
        }
    });
};


//取得購物車資料
function getOrderList() {
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,{
        headers:{
            "authorization" : token,
        }
    })
    .then(function(response){
        orderData= response.data.orders;
        let str = "";
        orderData.forEach(function(item){
            //組產品字串
            let productStr = "";
            item.products.forEach(function(productItem){
                productStr += `<p>${productItem.title}x${productItem.quantity}</p>`
            });
            //判斷訂單處理狀態
            let orderStatus="";
            if(item.paid == true){
                orderStatus="已處理";
            }else{orderStatus="未處理"};
            //組時間字串
            const timeStamp = new Date(item.createdAt*1000);
            const orderTime = `${timeStamp.getFullYear()}/${timeStamp.getMonth()+1}/${timeStamp.getDate()}`;
            //組訂單字串
            str += ` <tr>
                <td>${item.id}</td>
                <td>
                <p>${item.user.name}</p>
                <p>${item.user.tel}</p>
                </td>
                <td>${item.user.address}</td>
                <td>${item.user.email}</td>
                <td>
                ${productStr}
                </td>
                <td>${orderTime}</td>
                <td class="orderStatus">
                <a href="#" data-status="${item.paid}" class="js-orderStatus" data-id="${item.id}">${orderStatus}</a>
                </td>
                <td>
                <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id="${item.id}" value="刪除">
                </td>
            </tr>`;
        });
        orderList.innerHTML = str;
        renderC3_lv2()
    })
}

//訂單按鈕監聽
orderList.addEventListener("click",function(e){
    e.preventDefault();
    const targetClass = e.target.getAttribute("class");
    let id = e.target.getAttribute("data-id");
    //訂單狀態
    if(targetClass =="js-orderStatus"){
        let status = e.target.getAttribute("data-status");
        changeOrderStatus(status,id);
        return;
    };
    if(targetClass == "delSingleOrder-Btn js-orderDelete"){
        deleteOrderItem(id);
        return;
    };
    

});

//變更訂單狀態按鈕
function changeOrderStatus(status,id){
    let newStatus;
    if(status==true){
        newStatus=false;
    }else{
        newStatus=true;
    }
    axios.put(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,{
        "data": {
            "id": id,
            "paid": newStatus
          }
    },{
        headers:{
            "authorization" : token,
        }
    })
    .then(function(response){
        alert("修改訂單狀態成功");
        getOrderList();
    })
}

//刪除該筆訂單按鈕
function deleteOrderItem(id){
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders/${id}`,{
        headers:{
            "authorization" : token,
        }
    })
    .then(function(response){
        alert("刪除該筆訂單成功");
        getOrderList();
    })
}

//刪除全部訂單
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click",function(e){
    e.preventDefault();
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,{
        headers:{
            "authorization" : token,
        }
    })
    .then(function(response){
        alert("刪除全部訂單成功");
        getOrderList();
    })
})




