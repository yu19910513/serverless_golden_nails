import AuthenticationService from "../services/authenticationService";
import AppointmentService from "../services/appointmentService";
import CustomerService from "../services/customerService";
import ItemService from "../services/itemService";
import LocalDbService from "../services/localDbService";
import MiscellaneousService from "../services/miscellaneousService";
import NotificationService from "../services/notificationService";
import TechnicianService from "../services/technicianService";

// Utility to reset and mock http methods on a service instance
function mockHttp(service) {
  service.http.get = jest.fn();
  service.http.post = jest.fn();
  service.http.put = jest.fn();
  service.http.patch = jest.fn();
  service.http.delete = jest.fn();
}

describe("AuthenticationService", () => {
  beforeEach(() => mockHttp(AuthenticationService));

  it("send_code posts to /authentication/send-passcode", () => {
    AuthenticationService.send_code("user@example.com");
    expect(AuthenticationService.http.post).toHaveBeenCalledWith(
      "/authentication/send-passcode",
      { identifier: "user@example.com" }
    );
  });

  it("verify_passcode posts to /authentication/verify-passcode", () => {
    AuthenticationService.verify_passcode("+15551234", "123456");
    expect(AuthenticationService.http.post).toHaveBeenCalledWith(
      "/authentication/verify-passcode",
      { identifier: "+15551234", passcode: "123456" }
    );
  });
});

describe("CustomerService", () => {
  beforeEach(() => mockHttp(CustomerService));

  it("getOneByPhoneNumber calls GET with phone query", () => {
    CustomerService.getOneByPhoneNumber("+15550001111");
    expect(CustomerService.http.get).toHaveBeenCalledWith(
      "/customers/search?phone=+15550001111"
    );
  });

  it("validateUsingNumberAndName calls GET with phone and name", () => {
    CustomerService.validateUsingNumberAndName("+15550001111", "John");
    expect(CustomerService.http.get).toHaveBeenCalledWith(
      "/customers/validate?phone=+15550001111&name=John"
    );
  });

  it("upsert calls PUT /customers/ with payload", () => {
    const payload = { id: 1, name: "Jane", phone: "+15551234", email: "jane@x.io" };
    CustomerService.upsert(payload);
    expect(CustomerService.http.put).toHaveBeenCalledWith("/customers/", payload);
  });

  it("smart_search calls GET with keyword", () => {
    CustomerService.smart_search("smith");
    expect(CustomerService.http.get).toHaveBeenCalledWith(
      "/customers/smart_search?keyword=smith"
    );
  });
});

describe("ItemService", () => {
  beforeEach(() => mockHttp(ItemService));

  it("getAll calls GET /services/", () => {
    ItemService.getAll();
    expect(ItemService.http.get).toHaveBeenCalledWith("/services/");
  });
});

describe("LocalDbService", () => {
  beforeEach(() => mockHttp(LocalDbService));

  it("create posts to /local_db/{name} with data", () => {
    const data = { a: 1 };
    LocalDbService.create("config", data);
    expect(LocalDbService.http.post).toHaveBeenCalledWith("/local_db/config", data);
  });

  it("get calls GET /local_db/{name}", () => {
    LocalDbService.get("config");
    expect(LocalDbService.http.get).toHaveBeenCalledWith("/local_db/config");
  });

  it("getField calls GET with repeated path params", () => {
    LocalDbService.getField("config", ["app", "version"]);
    expect(LocalDbService.http.get).toHaveBeenCalledWith(
      "/local_db/config/field?path=app&path=version"
    );
  });

  it("update calls PUT /local_db/{name} with data", () => {
    const data = { a: 2 };
    LocalDbService.update("config", data);
    expect(LocalDbService.http.put).toHaveBeenCalledWith("/local_db/config", data);
  });

  it("updateField calls PATCH with body {path, value}", () => {
    LocalDbService.updateField("config", ["a", "b"], 123);
    expect(LocalDbService.http.patch).toHaveBeenCalledWith(
      "/local_db/config/field",
      { path: ["a", "b"], value: 123 }
    );
  });

  it("deleteField calls DELETE with body { data: { path } }", () => {
    LocalDbService.deleteField("config", ["a", "b"]);
    expect(LocalDbService.http.delete).toHaveBeenCalledWith(
      "/local_db/config/field",
      { data: { path: ["a", "b"] } }
    );
  });

  it("delete calls DELETE /local_db/{name}", () => {
    LocalDbService.delete("config");
    expect(LocalDbService.http.delete).toHaveBeenCalledWith("/local_db/config");
  });
});

describe("MiscellaneousService", () => {
  beforeEach(() => mockHttp(MiscellaneousService));

  it("find calls GET /miscellaneouses/key?title=...", () => {
    MiscellaneousService.find("bufferTime");
    expect(MiscellaneousService.http.get).toHaveBeenCalledWith(
      "/miscellaneouses/key?title=bufferTime"
    );
  });

  it("findAll calls GET /miscellaneouses/", () => {
    MiscellaneousService.findAll();
    expect(MiscellaneousService.http.get).toHaveBeenCalledWith("/miscellaneouses/");
  });
});

describe("NotificationService", () => {
  beforeEach(() => mockHttp(NotificationService));

  it("notify posts to /notification/notify with messageData", () => {
    const messageData = { recipient_name: "Jane", action: "confirm" };
    NotificationService.notify(messageData);
    expect(NotificationService.http.post).toHaveBeenCalledWith(
      "/notification/notify",
      { messageData }
    );
  });

  it("contact posts to /notification/contact with email_object", () => {
    const email_object = { name: "John", email: "john@example.com", message: "Hi" };
    NotificationService.contact(email_object);
    expect(NotificationService.http.post).toHaveBeenCalledWith(
      "/notification/contact",
      { email_object }
    );
  });
});

describe("TechnicianService", () => {
  beforeEach(() => mockHttp(TechnicianService));

  it("getAll calls GET /technicians/", () => {
    TechnicianService.getAll();
    expect(TechnicianService.http.get).toHaveBeenCalledWith("/technicians/");
  });

  it("getAvailableTechnicians posts to /technicians/available with categoryIds", () => {
    const categoryIds = [101, 102];
    TechnicianService.getAvailableTechnicians(categoryIds);
    expect(TechnicianService.http.post).toHaveBeenCalledWith(
      "/technicians/available",
      { categoryIds }
    );
  });

  it("getScheduleByDate calls GET with params object", () => {
    const date = "2025-12-23";
    TechnicianService.getScheduleByDate(date);
    expect(TechnicianService.http.get).toHaveBeenCalledWith(
      "/technicians/schedule",
      { params: { date } }
    );
  });
});

// AppointmentService tests combined from separate file
describe("AppointmentService", () => {
  let service;

  beforeEach(() => {
    service = AppointmentService;
    // Mock the http client methods:
    service.http.get = jest.fn();
    service.http.post = jest.fn();
    service.http.put = jest.fn();
  });

  describe("getTechnicianGroupedAppointments", () => {
    it("throws error on invalid date format", () => {
      expect(() => service.getTechnicianGroupedAppointments("invalid-date")).toThrow(
        "Invalid date format. Expected YYYY-MM-DD."
      );
    });

    it("calls http.get with correct URL for valid date", () => {
      const date = "2025-02-20";
      service.getTechnicianGroupedAppointments(date);
      expect(service.http.get).toHaveBeenCalledWith(`/appointments/calender?date=${date}`);
    });
  });

  describe("findByTechId", () => {
    it("calls http.get with correct URL and technician ID", () => {
      const techId = 123;
      service.findByTechId(techId);
      expect(service.http.get).toHaveBeenCalledWith(`/appointments/upcoming?tech_id=${techId}`);
    });
  });

  describe("create", () => {
    it("calls http.post with correct URL and appointment data", () => {
      const data = { customer_id: 1, date: "2025-01-25", start_service_time: "14:00", technician_id: [2], service_ids: [3] };
      service.create(data);
      expect(service.http.post).toHaveBeenCalledWith("/appointments", data);
    });
  });

  describe("customer_history", () => {
    it("calls http.get with correct URL and customer ID", () => {
      const customerId = 5;
      service.customer_history(customerId);
      expect(service.http.get).toHaveBeenCalledWith(`/appointments/customer_history?customer_id=${customerId}`);
    });
  });

  describe("soft_delete", () => {
    it("calls http.put with correct URL and data for soft delete", () => {
      const apptId = 7;
      service.soft_delete(apptId);
      expect(service.http.put).toHaveBeenCalledWith("/appointments/update_note", { id: apptId, note: "deleted" });
    });
  });

  describe("search", () => {
    it("calls http.get with correct URL and keyword", () => {
      const keyword = "john";
      service.search(keyword);
      expect(service.http.get).toHaveBeenCalledWith(`/appointments/search?keyword=${keyword}`);
    });
  });

  describe("find_alternative_techs", () => {
    it("calls http.get with correct URL and appointment ID", () => {
      const apptId = "123";
      service.find_alternative_techs(apptId);
      expect(service.http.get).toHaveBeenCalledWith(`/appointments/find_alternative_techs?id=${apptId}`);
    });
  });

  describe("update_technician", () => {
    it("calls http.put with correct URL and data", () => {
      const apptId = 10;
      const techId = 20;
      service.update_technician(apptId, techId);
      expect(service.http.put).toHaveBeenCalledWith("/appointments/update_technician", { id: apptId, technician_id: techId });
    });
  });
});
