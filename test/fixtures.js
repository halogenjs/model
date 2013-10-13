var fixtures = {
	"/services_curie" : {
		_links : {
			self : {
				href : "/services"
			},
			curie : {
				name : "app",
				templated : true,
				href : "/services/rels/{rel}"
			},
			"app:test" : {
				href : "/services/test"
			},
			"app:helloworld" : {
				href : "/services/helloworld"
			},
			"app:thing" : {
				href : "/services/thing/{id}",
				templated: true
			}
		}

	},
	"/services_curies" : {
		_links : {
			self : {
				href : "/services"
			},
			curies : [
				{
					name : "app",
					templated : true,
					href : "/services/rels/{rel}"
				}
			],
			"app:test" : {
				href : "/services/test"
			},
			"app:helloworld" : {
				href : "/services/helloworld"
			},
			"app:thing" : {
				href : "/services/thing/{id}",
				templated: true
			}
		}

	},

	"/attribute-test" : {
		_links : {
			self : {
				href : "/attribute-test"
			}
		},
		anObject : {
			name : "name inside an object",
			description : "description inside an object"

		},
		anArrayofObjects : [
			{
				name : "obj 1",
				description: "desc 1"
			},
			{
				name : "obj 2",
				description : "desc 2"
			},
			{
				name : "obj 3",
				description : "desc 3"
			}
		]
	},

	"/embed-test" : {
		_links : {
			self : {
				href : "/embed-test"
			}
		},
		_embedded : {
			"single-item" : {
				_links : {
					self : {
						href : "/single-item"
					},
				},
				name : "single item",
				description : "A single item"
			},
			"multiple-items" : [
				{
					_links : {
						self : {
							href : "/items/1"
						}
					},
					name : "Item one",
					description: "Item one of many"
				},
				{
					_links : {
						self : {
							href : "/items/2"
						}
					},
					name : "Item two",
					description: "Item two of many"
				},
				{
					_links : {
						self : {
							href : "/items/3"
						}
					},
					name : "Item three",
					description: "Item three of many"
				}
			]
		}

	},

	"/tasklist" : {
		_links : {
			self : {
				href : "/tasklist"
			},
			curie : {
				name : "controls",
				href : "/tasklist#controls/{rel}",
				templated : true
			},
			"controls:create-new" : {
				href : "#controls/edit/create-task"
			}
		},
		Count : 3,
		_controls : {
			edit : {
				"create-task" : {
					action : "/tasklist/create",
					method : "POST",
					encoding : "application/x-www-form-urlencoded",
					properties : [
						{
							name : "description",
							type : "text",
							value : "",
							placeholder : "Add description here",
							required : "required"
						},
						{
							name : "etag",
							type : "hidden",
							value : "adefdfad34246736"
						},
						{
							name : "submit",
							type : "submit",
							value : "Save"
						}
					]
				}

			}
		},
		_embedded : {
			"task" : [
				{
					_links : {
						self : {
							href: "/tasks/1"
						},
						curie : {
							name : "controls",
							href : "/tasks/1#controls/{rel}",
							templated : true
						},
						"controls:complete" : {
							href : '#controls/edit/complete-some-task'
						},
						"controls:edit" : {
							href : '#controls/edit/edit-task'
						},
						"controls:delete" : {
							href : '#controls/edit/delete-task'
						},
					},
					description : "Do this task",
					tasktype : "Default priority",
					created : 1381580070704,
					last_updated : 1381580103672,
					etag : "adefdfad34246736",
					_controls : {
						edit : {
							"complete-some-task" : {
								action : "/tasks/1/complete",
								method : "PUT",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "etag",
										type : "hidden",
										value : "adefdfad34246736"
									},
									{
										name : "submit",
										type : "submit",
										value : "Complete"
									}
								]
							},
							"delete-task" : {
								name : "delete-task",
								action : "/tasks/1/delete",
								method : "DELETE",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "etag",
										type : "hidden",
										value : "adefdfad34246736"
									},
									{
										name : "submit",
										type : "submit",
										value : "Delete"
									}
								]

							},
							"edit-task" : {
								action : "/tasks/1/edit",
								method : "PUT",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "description",
										type : "text",
										value : "Do this task",
										placeholder : "Add description here",
										required : "required"
									},
									{
										name : "tasktype",
										type : "select",
										options : [
											{
												name : "Default priority",
												value : "default",
												selected : "selected"
											},
											{
												name : "Urgent",
												value : "urgent"
											},
											{
												name : "File 13",
												value : "ignore"
											}
										]
									},
									{
										name : "etag",
										type : "hidden",
										value : "adefdfad34246736"
									},
									{
										name : "submit",
										type : "submit",
										value : "Save"
									}
								]

							}
						}
	
					}
				},
				{
					_links : {
						self : {
							href: "/tasks/2"
						},
						curie : {
							name : "controls",
							href : "/tasks/2#controls/{rel}",
							templated : true
						},
						"controls:complete" : {
							href : '#controls/edit/complete-different-kind-of-task'
						},
						"controls:edit" : {
							href : '#controls/edit/edit-task'
						},
						"controls:delete" : {
							href : '#controls/edit/delete-task'
						},
					},
					description : "Put the lotion in the basket",
					tasktype : "Urgent",
					created : 1381666804016,
					last_updated : 1381666804016,
					etag : "dadadcecdcadcecdcdcaec",
					_controls : {
						edit : {
							"complete-different-kind-of-task" : {
								action : "/tasks/2/complete",
								method : "PUT",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "etag",
										type : "hidden",
										value : "dadadcecdcadcecdcdcaec"
									},
									{
										name : "submit",
										type : "submit",
										value : "Complete"
									}
								]
							},
							"delete-task" : {
								name : "delete-task",
								action : "/tasks/1/delete",
								method : "DELETE",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "etag",
										type : "hidden",
										value : "dadadcecdcadcecdcdcaec"
									},
									{
										name : "submit",
										type : "submit",
										value : "Delete"
									}
								]

							},
							"edit-task" : {
								action : "/tasks/1/edit",
								method : "PUT",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "description",
										type : "text",
										value : "Put the lotion in the basket",
										placeholder : "Add description here",
										required : "required"
									},
									{
										name : "tasktype",
										type : "select",
										options : [
											{
												name : "Default",
												value : "default"
											},
											{
												name : "Urgent",
												value : "urgent",
												selected : "selected"
											},
											{
												name : "File 13",
												value : "ignore"
											}
										]
									},
									{
										name : "etag",
										type : "hidden",
										value : "dadadcecdcadcecdcdcaec"
									},
									{
										name : "submit",
										type : "submit",
										value : "Save"
									}
								]

							}
						}
	
					}
				},
				{
					_links : {
						self : {
							href: "/tasks/3"
						},
						curie : {
							name : "controls",
							href : "/tasks/3#controls/{rel}",
							templated : true
						},
						"controls:complete" : {
							href : '#controls/edit/complete-yet-another-type-of-task'
						},
						"controls:edit" : {
							href : '#controls/edit/edit-task'
						},
						"controls:delete" : {
							href : '#controls/edit/delete-task'
						}
					},
					description : "Do this task",
					tasktype : "Default priority",
					created : 1381580070704,
					last_updated : 1381679058602,
					etag : "1758475ecdacdeacddecac",
					_controls : {
						edit : {
							"complete-yet-another-type-of-task" : {
								action : "/tasks/3/complete",
								method : "PUT",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "etag",
										type : "hidden",
										value : "1758475ecdacdeacddecac"
									},
									{
										name : "submit",
										type : "submit",
										value : "Complete"
									}
								]
							},
							"delete-task" : {
								name : "delete-task",
								action : "/tasks/3/delete",
								method : "DELETE",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "etag",
										type : "hidden",
										value : "1758475ecdacdeacddecac"
									},
									{
										name : "submit",
										type : "submit",
										value : "Delete"
									}
								]

							},
							"edit-task" : {
								action : "/tasks/3/edit",
								method : "PUT",
								encoding : "application/x-www-form-urlencoded",
								properties : [
									{
										name : "description",
										type : "text",
										value : "Do this task",
										placeholder : "Add description here",
										required : "required"
									},
									{
										name : "tasktype",
										type : "select",
										options : [
											{
												name : "Default priority",
												value : "default",
												selected : "selected"
											},
											{
												name : "Urgent",
												value : "urgent"
											},
											{
												name : "File 13",
												value : "ignore"
											}
										]
									},
									{
										name : "etag",
										type : "hidden",
										value : "1758475ecdacdeacddecac"
									},
									{
										name : "submit",
										type : "submit",
										value : "Save"
									}
								]

							}
						}
	
					}
				}
			]
		}
	}

};

var useFixture = function(id){

	return JSON.parse( JSON.stringify(fixtures[id]) );

};