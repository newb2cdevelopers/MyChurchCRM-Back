export type WorkfrontAssignment =  {
  Worfronts: WorkfrontDto [],
  Users: UserAssignment []

}


export type UserAssignment =  {
  Id: string,
  Name: String
  CurrentWorkfront: string
}


export type WorkfrontDto =  {
  Id: string,
  Name: string
}

export type WorkfrontSaveAssignment = {
  workfrontId: string,
  users: string[]
}