const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const { getDashboard } = require("../controllers/dashboard.controller");
const { adminRegister, adminLogin, adminLogout, registerUser, employeeSelfRegister, loginUser, assignUser, getEmployeesByDistributor } = require("../controllers/auth.controller");
const { getPendingUsers, approveUser, rejectUser, changeStatus } = require("../controllers/admin.controller");
const { getAllUsers, getUserById, updateUser, deleteUser, getProfile, updateProfile, updateUserStatus } = require("../controllers/user.controller");
const { createArea, getAreas, getAreaById, updateArea, deleteArea, getAreaShops, searchShops, getNearbyShops, getShopHistory } = require("../controllers/area.controller");
const { createBeatPlan, getBeatPlans, getDeliveryBoyBeatPlans, getBeatPlanById, updateBeatPlan, deleteBeatPlan, getTodayBeat, getEmployeeBeats, getBeatShops, getBeatShopDetails, getBeatSummary, startBeat, completeBeat, completeShopVisit, getBeatProgress, getRouteShops, getEmployeeDashboard, getTodayTarget, getEmployeePerformance, getMissedShops, getRevisitShops, assignDeliveryBoyToBeatPlan, assignDeliveryBoyToBeatPlans } = require("../controllers/beatplan.controller");
const { createBrand, getBrands, updateBrand, deleteBrand, getBrandById, } = require("../controllers/brand.controller");
const { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } = require("../controllers/category.controller");
const { getProductVariants, getProductsByRawMaterial, createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require("../controllers/product.controller");
const { createParty, getParties, getShopsByRoute, getPartyById, updateParty, deleteParty } = require("../controllers/party.controller");
const { createRoute, getRoutes, getRouteById, updateRoute, deleteRoute, getRouteSummary } = require("../controllers/route.controller");
const { getAttendances, getAttendanceById, createAttendance, checkIn, checkOut, getTodayAttendance, getMonthlyAttendance, getAttendanceSummary } = require("../controllers/attendance.controller");
const { getVisits, getVisitById, startVisit, completeVisit, pendingVisit, cancelVisit, getTodayVisits, getVisitSummary, getEmployeeVisits, checkActiveVisit, checkActiveEmployeeVisit } = require("../controllers/visit.controller");
const { createOrder, getOrders, getOrderById, updateOrder, cancelOrder, approveOrder, rejectOrder, processOrder, markDelivered, getPartyOrders, getEmployeeOrders } = require("../controllers/order.controller");
const { createOrderItem, updateOrderItem, deleteOrderItem } = require("../controllers/orderitem.controller");
const { createCollection, getCollections, getCollectionById, updateCollection, deleteCollection, verifyCollection, rejectCollection, getOutstanding, getPartyOutstanding, getEmployeeOutstanding, getEmployeeCollections } = require("../controllers/collection.controller");
const { createDelivery, getDeliveries, getDeliveryById, updateDelivery, assignDeliveryBoy, dispatchDelivery, markDelivereds, markFailed, getDeliveryBoyCompletedDeliveries, getDeliveryBoyPendingDeliveries, getDeliveryBoyCollections, getDeliveryBoyPendingCollections } = require("../controllers/delivery.controller");
const { createStock, getStock, updateStock, increaseStock, decreaseStock, getLowStock, getStockSummary } = require("../controllers/stock.controller");
const { getTransactions, getTransactionById, stockIn, stockOut, adjustStock, returnStock } = require("../controllers/stocktransaction.controller");
const { createNotification, getNotifications, markAsRead, deleteNotification, sendOrderNotification, sendCollectionNotification, sendStockAlert } = require("../controllers/notification.controller");
const { applyLeave, getLeaves, updateLeave, approveLeave, rejectLeave } = require("../controllers/leave.controller");
const { createTarget, getTargets, updateTarget, deleteTarget, assignTarget, getAchievement, getTargetSummary } = require("../controllers/employeetarget.controller");
const { getWarehouseStock, updateStockReceive, deleteStockReceive, getAvailableStockReceives, createStockReceive, getAvailableStock, getAvailableStockByProduct, getAllStockReceives, getStockReceiveById } = require("../controllers/stock-receive.controller");
const { createSupplier, getAllSuppliers, getSupplierById, updateSupplier, deleteSupplier } = require("../controllers/supplier.controller");
const { getNextProductionNo, deleteProduction, createProduction, getAllProductions, getProductionById, updateProduction, getProductionsByWarehouse } = require("../controllers/production.controllers");
const { getRawMaterialsByWarehouse, createWarehouse, getAllWarehouses, getWarehouseById, updateWarehouse, deleteWarehouse, getAllFinishedGoodsStock, getFinishedGoodsStockByWarehouse } = require("../controllers/warehouse.controller");
const { createRawMaterial, getAllRawMaterials, getRawMaterialById, updateRawMaterial, deleteRawMaterial, getRawMaterialDropdown, getRawMaterialStockByWarehouse } = require("../controllers/rawmaterial.controller");
const { createMainCategory, getAllMainCategories, getMainCategoryById, updateMainCategory, deleteMainCategory } = require("../controllers/maincategory.controller");
const { createProductionInstruction, getAllProductionInstructions, getProductionInstructionById, updateProductionInstruction, acceptProductionInstruction, cancelProductionInstruction, deleteProductionInstruction, getNextInstructionNo, getProductionInstructionsByWarehouse } = require("../controllers/production-instruction.controller");

const { getNextStockTransferNo, createStockTransfer, getAllStockTransfers, getStockTransferById, getStockTransfersByWarehouse, updateStockTransferStatus, deleteStockTransfer, getDistributorIncomingTransfers,
    getDistributorTransferById, receiveStockTransfer, getMyDistributorStock, getDistributorStockHistory, getMyEmployees, getMyEmployeeById } = require("../controllers/stock-transfer.controller");



router.get("/get-dashboard", authMiddleware, getDashboard);

router.post("/admin-register", adminRegister);
router.post("/admin-login", adminLogin);
router.post("/admin/logout", adminLogout);
router.post("/user-register", upload.single("profileImage"), registerUser);
router.post("/employeeSelfRegister", upload.single("profileImage"), employeeSelfRegister);
router.post("/user-login", loginUser);
router.put("/assign-user/:userId", assignUser);
router.get("/distributor/:distributorId/employees", getEmployeesByDistributor);

// approvel
router.get("/pending-users", getPendingUsers);
router.put("/approve-user/:id", approveUser);
router.put("/reject-user/:id", rejectUser);
router.put("/change-status/:id", changeStatus);

// user-crud
router.get("/getall-users", getAllUsers);
router.get("/getbyid-users/:id", getUserById);
router.put("/update-users/:id", upload.single("profileImage"), updateUser);
router.delete("/delete-users/:id", deleteUser);
router.get("/get-profile/:id", getProfile);
router.put("/update-profile/:id", upload.single("profileImage"), updateProfile);
router.patch("/users/:id/status", updateUserStatus);

// area
router.post("/caret-areas", createArea);
router.get("/getall-areas", getAreas);
router.get("/getbyid-areas/:id", getAreaById);
router.put("/update-areas/:id", updateArea);
router.delete("/Delete-areas/:id", deleteArea);
router.get("/area-shops/:areaId", getAreaShops);
router.get("/search-shops", searchShops);
router.get("/nearby-shops", getNearbyShops);
router.get("/shop-history/:shopId", getShopHistory);


// beatplan
router.post("/careate-beat-plans", createBeatPlan);
router.get("/getall-beat-plans", getBeatPlans);
router.get("/get-delivery-boy-beat-plans", getDeliveryBoyBeatPlans);
router.get("/getbyid-beat-plans/:id", getBeatPlanById);
router.put("/update-beat-plans/:id", updateBeatPlan);
router.delete("/delete-beat-plans/:id", deleteBeatPlan);
router.get("/today-beat/:employeeId", getTodayBeat);
router.get("/employee-beats/:employeeId", getEmployeeBeats);
router.get("/beat-shops/:beatId", getBeatShops);
router.get("/beat-shop/:shopId", getBeatShopDetails);
router.get("/beat-summary/:employeeId", getBeatSummary);
router.put("/start-beat/:beatId", startBeat);
router.put("/complete-beat/:beatId", completeBeat);
router.put("/complete-shop-visit", completeShopVisit);
router.get("/beat-progress/:beatId", getBeatProgress);
router.get("/route-shops/:routeId", getRouteShops);
router.get("/employee-dashboard/:employeeId", getEmployeeDashboard);
router.get("/today-target/:employeeId", getTodayTarget);
router.get("/employee-performance/:employeeId", getEmployeePerformance);
router.get("/missed-shops/:employeeId", getMissedShops);
router.get("/revisit-shops/:employeeId", getRevisitShops);
router.put("/assign-delivery-boy/:id", assignDeliveryBoyToBeatPlan);
router.put("/assign-delivery-boy-to-beatplans", assignDeliveryBoyToBeatPlans);

// barand
router.post("/create-brands", upload.fields([{ name: "logo", maxCount: 1 }, { name: "bannerImage", maxCount: 1 }]), createBrand);
router.get("/get-brands", getBrands);
router.put("/update-brands/:id", upload.fields([{ name: "logo", maxCount: 1 }, { name: "bannerImage", maxCount: 1 }]), updateBrand);
router.get("/getbyid-brands/:id", getBrandById);
router.delete("/delete-brands/:id", deleteBrand);


// category
router.post("/create-categories", upload.single("image"), createCategory);
router.get("/getall-categories", getCategories);
router.put("/update-categories/:id", upload.single("image"), updateCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/getCategory-ById/:id", getCategoryById);

// product
router.get("/variants/:productId", getProductVariants);
router.post("/create-products", upload.fields([{ name: "image", maxCount: 1 }, { name: "gallery", maxCount: 10 }]), createProduct);
router.get("/getall-products", getProducts);
router.get("/getbyid-products/:id", getProductById);
router.put("/update-products/:id", upload.fields([{ name: "image", maxCount: 1 }, { name: "gallery", maxCount: 10 }]), updateProduct);
router.delete("/delete-products/:id", deleteProduct);
router.get("/products-by-raw-material/:rawMaterialId", getProductsByRawMaterial);

// party
router.post("/create-parties", upload.single("shopImage"), createParty);
router.get("/getall-parties", getParties);
router.get("/get-shops-by-route/:routeId", getShopsByRoute);
router.get("/getbyid-parties/:id", getPartyById);
router.put("/update-parties/:id", updateParty);
router.delete("/delete-parties/:id", deleteParty);

// routs
router.post("/create-routes", createRoute);
router.get("/getall-routes", getRoutes);
router.get("/getbyid-routes/:id", getRouteById);
router.put("/update-routes/:id", updateRoute);
router.delete("/delet-routes/:id", deleteRoute);
router.get("/route-summary/:routeId", getRouteSummary);



// GET ATTENDANCES
router.get("/get-attendances", getAttendances);
router.get("/getbyid-attendances/:id", getAttendanceById);
router.post("/create-attendances", upload.single("checkInSelfie"), createAttendance);
router.post("/chickin-attendance/checkin", upload.single("checkInSelfie"), checkIn);
router.put("/attendance/checkout/:id", upload.single("checkOutSelfie"), checkOut);
router.get("/attendance/today/:employeeId", getTodayAttendance);
router.get("/attendance/monthly/:employeeId", getMonthlyAttendance);
router.get("/attendance/summary/:employeeId", getAttendanceSummary);
// router.get("/attendance/summary/:employeeId", getAttendanceSummary);

// GET VISITS
router.get("/get-visits", getVisits);
router.get("/getbyid-visits/:id", getVisitById);
router.post("/start-visit", startVisit);
router.put("/complete-visit/:id", completeVisit);
router.put("/pending-visit/:id", pendingVisit);
router.put("/cancel-visit/:id", cancelVisit);
router.get("/today-visits/:employeeId", getTodayVisits);
router.get("/visit-summary/:employeeId", getVisitSummary);
router.get("/employee-visits/:employeeId", getEmployeeVisits);
router.get("/active-visit/:employeeId/:partyId", checkActiveVisit);
router.get("/active-employee-visit/:employeeId", checkActiveEmployeeVisit);

// order
router.post("/create-order", createOrder);
router.get("/get-orders", authMiddleware, getOrders);
router.get("/getbyid-orders/:id", authMiddleware, getOrderById);
router.put("/update-orders/:id", updateOrder);
router.put("/cancel-orders/:id", cancelOrder);

router.put("/approve-order/:id", approveOrder);
router.put("/reject-order/:id", rejectOrder);
router.put("/process-order/:id", processOrder);
router.put("/mark-delivered/:id", markDelivered);
router.get("/party-orders/:partyId", getPartyOrders);
router.get("/employee-orders/:employeeId", getEmployeeOrders);

// OrderItem    
router.post("/create-order-item", createOrderItem);
router.put("/update-order-items/:id", updateOrderItem);
router.delete("/delete-order-items/:id", deleteOrderItem);

// collections
router.post("/create-collection", createCollection);
router.get("/get-collections", getCollections);
router.get("/get-collection/:id", getCollectionById);
router.put("/update-collection/:id", updateCollection);
router.delete("/delete-collection/:id", deleteCollection);
router.put("/verify-collection/:id", verifyCollection);
router.put("/reject-collection/:id", rejectCollection);
router.get("/get-outstanding", getOutstanding);
router.get("/get-party-outstanding/:partyId", getPartyOutstanding);
router.get("/employee-outstanding/:employeeId", getEmployeeOutstanding);
router.get("/get-employee-collection-summary/:employeeId", getEmployeeCollections);

router.post("/create-deliveries", createDelivery);
router.get("/getall-deliveries", authMiddleware, getDeliveries);
router.get("/getbyid-deliveries/:id", getDeliveryById);
router.put("/update-deliveries/:id", updateDelivery);
router.put("/assign-delivery-boy/:id", assignDeliveryBoy);
router.put("/dispatch-delivery/:id", authMiddleware, dispatchDelivery);
router.put("/mark-delivery-completed/:id", authMiddleware, markDelivereds);
router.put("/mark-delivery-failed/:id", authMiddleware, markFailed);
router.get("/get-delivery-boy-completed-deliveries", authMiddleware, getDeliveryBoyCompletedDeliveries);
router.get("/get-delivery-boy-pending-deliveries", authMiddleware, getDeliveryBoyPendingDeliveries);
router.get("/get-delivery-boy-collections", authMiddleware, getDeliveryBoyCollections);
router.get("/get-delivery-boy-pending-collections", authMiddleware, getDeliveryBoyPendingCollections);



router.post("/create-stock", createStock);
router.get("/get-stock", getStock);
router.put("/update-stock/:id", updateStock);
router.put("/increase-stock/:id", increaseStock);
router.put("/decrease-stock/:id", decreaseStock);
router.get("/low-stock", getLowStock);
router.get("/stock-summary", getStockSummary);


// stockTransection

router.get("/get-transactions", getTransactions);
router.get("/getbyid-transactions/:id", getTransactionById);
router.post("/stock-in", stockIn);
router.post("/stock-out", stockOut);
router.post("/adjust-stock", adjustStock);
router.post("/return-stock", returnStock);

// notifications
router.post("/create-notification", createNotification);
router.get("/get-notifications", getNotifications);
router.put("/mark-notification-read/:id", markAsRead);
router.delete("/delete-notification/:id", deleteNotification);
router.post("/send-order-notification", sendOrderNotification);
router.post("/send-collection-notification", sendCollectionNotification);
router.post("/send-stock-alert", sendStockAlert);

// levels

router.post("/apply-leave", applyLeave);
router.get("/get-leaves", getLeaves);
router.put("/update-leave/:id", updateLeave);
router.put("/approve-leave/:id", approveLeave);
router.put("/reject-leave/:id", rejectLeave);

router.post("/create-target", createTarget);
router.get("/get-targets", getTargets);
router.put("/update-target/:id", updateTarget);
router.delete("/delete-target/:id", deleteTarget);
router.put("/assign-target/:id", assignTarget);
router.get("/achievement/:id", getAchievement);
router.get("/target-summary", getTargetSummary);

router.post("/create-stock-receive", createStockReceive);
router.get("/get-all-stock-receives", getAllStockReceives);
router.get("/get-stock-receive/:id", getStockReceiveById);
router.get("/get-available-stock/:productId", getAvailableStockByProduct);
router.get("/available-stockReceiveController/:productId", getAvailableStockReceives);
router.put("/update-stock-receive/:id", updateStockReceive);
router.delete("/delete-stock-receive/:id", deleteStockReceive);
router.get("/available-stock", getAvailableStock);
router.get("/warehouse-stock/:warehouseId", getWarehouseStock);

router.post("/create-supplier", createSupplier);
router.get("/get-all-suppliers", getAllSuppliers);
router.get("/get-supplier/:id", getSupplierById);
router.put("/update-supplier/:id", updateSupplier);
router.delete("/delete-supplier/:id", deleteSupplier);


router.post("/create-production", createProduction);
router.get("/get-all-productions", getAllProductions);
router.get("/getProductionById/:id", getProductionById);
router.delete("/delete-production/:id", deleteProduction);
router.put("/updateProduction/:id", updateProduction);
router.delete("/deleteprocuction/:id", deleteProduction);
router.get("/next-number", getNextProductionNo);
router.get("/warehouse/:warehouseId", getProductionsByWarehouse);


router.post("/create-production-instruction", createProductionInstruction);
router.get("/get-all-production-instructions", getAllProductionInstructions);
router.get("/getProductionInstructionById/:id", getProductionInstructionById);
router.put("/updateProductionInstruction/:id", updateProductionInstruction);
router.put("/acceptProductionInstruction/:id", acceptProductionInstruction);
router.put("/cancelProductionInstruction/:id", cancelProductionInstruction);
router.delete("/delete-production-instruction/:id", deleteProductionInstruction);
router.get("/production-instruction/next-number", getNextInstructionNo);
router.get("/production-instruction/warehouse/:warehouseId", getProductionInstructionsByWarehouse);

router.post("/create-warehouse", createWarehouse);
router.get("/getallwarehouse", getAllWarehouses);
router.get("/getbyid-warehouse/:id", getWarehouseById);
router.put("/update-warehouse/:id", updateWarehouse);
router.delete("/deletewarehouse/:id", deleteWarehouse);
router.get("/warehouse-raw-materials/:warehouseId", getRawMaterialsByWarehouse);
// router.get("/finished-goods-stock/warehouse/:warehouseId", getFinishedGoodsStockByWarehouse);
router.get("/finished-goods-stock", getAllFinishedGoodsStock);
router.get("/finished-goods-stock/warehouse/:warehouseId", getFinishedGoodsStockByWarehouse);


router.post("/create-raw-material", createRawMaterial);
router.get("/get-all-raw-materials", getAllRawMaterials);
router.get("/getbyid-raw-material/:id", getRawMaterialById);
router.put("/update-raw-material/:id", updateRawMaterial);
router.delete("/delete-raw-material/:id", deleteRawMaterial);
router.get("/raw-material-dropdown", getRawMaterialDropdown);
router.get("/raw-material-stock/:warehouseId", getRawMaterialStockByWarehouse);


router.post("/create-main-category", createMainCategory);
router.get("/get-all-main-categories", getAllMainCategories);
router.get("/getbyid-main-category/:id", getMainCategoryById);
router.put("/update-main-category/:id", updateMainCategory);
router.delete("/delete-main-category/:id", deleteMainCategory);



// =====================================================
// STOCK TRANSFE
// =====================================================

router.get("/stock-transfer/next-number", getNextStockTransferNo);
router.post("/create-stock-transfer", createStockTransfer);
router.get("/get-all-stock-transfers", getAllStockTransfers);
router.get("/getStockTransferById/:id", getStockTransferById);
router.get("/warehouse/:warehouseId", getStockTransfersByWarehouse);
router.put("/update-status/:id", updateStockTransferStatus);
router.delete("/delete-stock-transfer/:id", deleteStockTransfer);

router.get("/incoming-transfers", authMiddleware, getDistributorIncomingTransfers);
router.get("/incoming-transfers/:id", authMiddleware, getDistributorTransferById);
router.put("/incoming-transfers/:id/receive", authMiddleware, receiveStockTransfer);
router.get("/my-stock/:distributorId", getMyDistributorStock);
router.get("/stock-history", authMiddleware, getDistributorStockHistory);


// Get all employees assigned to logged-in distributor
router.get(
    "/my-employees/:distributorId",
    getMyEmployees
);
// Get particular employee details
router.get("/my-employee-details/:employeeId", authMiddleware, getMyEmployeeById);

module.exports = router;
